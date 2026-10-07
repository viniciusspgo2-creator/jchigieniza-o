import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { normalizePhone, bookingPublicSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { availableSlots, isSlotValid, isPeriodValid } from '@/lib/slots';
import { spWallTimeToUTC, todaySP, isValidDateStr } from '@/lib/tz';
import { notify } from '@/lib/audit';
import { waLink, waMessageBooking } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/** POST /api/agendamento — solicitação pública de agendamento. */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`booking:${ip}`, 5, 15 * 60_000);
    if (!rl.ok) {
      return fail(`Muitas solicitações em sequência. Tente novamente em ${Math.ceil(rl.retryAfterSec / 60)} minuto(s).`, 429);
    }

    const parsed = await parseBody(req, bookingPublicSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    // Serviço existe e está ativo?
    const service = await db.service.findUnique({ where: { slug: data.serviceSlug } });
    if (!service || !service.active) return fail('Serviço indisponível. Selecione um serviço válido.', 422);

    // Data: hoje (SP) ou futuro, máx 120 dias
    const today = todaySP();
    if (data.preferredDate < today) return fail('Escolha uma data a partir de hoje.', 422);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 120);
    const maxStr = maxDate.toISOString().slice(0, 10);
    if (data.preferredDate > maxStr) return fail('Escolha uma data em até 120 dias.', 422);

    // Janela: fixa e disponível OU período livre informado
    const hasFixedSlot = /^\d{2}:\d{2}$/.test(data.timeSlot);
    if (hasFixedSlot) {
      const valid = await isSlotValid(data.preferredDate, data.timeSlot);
      if (!valid) {
        const slots = await availableSlots(data.preferredDate);
        const open = slots.filter((s) => s.available).map((s) => s.slot);
        return fail('Essa janela de horário acabou de ficar indisponível.', 409, { openSlots: open });
      }
    } else if (!isPeriodValid(data.period)) {
      return fail('Selecione uma janela de horário ou um período.', 422);
    }

    // Cliente: find-or-create por telefone normalizado (prevenção de duplicidade)
    const phone = normalizePhone(data.phone);
    const customer = await db.customer.upsert({
      where: { phone },
      update: { name: data.name },
      create: {
        name: data.name,
        phone,
        addressStreet: data.streetAddress,
        addressDistrict: data.district,
        addressCity: data.city?.trim() || 'Goiânia',
        addressState: 'GO',
      },
    });

    // Protocolo sequencial
    const year = new Date().getFullYear();
    const seq = (await db.booking.count()) + 1;
    const protocol = `JC-${year}-${String(seq).padStart(6, '0')}`;

    const scheduledAt = hasFixedSlot ? spWallTimeToUTC(data.preferredDate, data.timeSlot) : null;

    const booking = await db.booking.create({
      data: {
        protocol,
        customerId: customer.id,
        name: data.name,
        phone,
        serviceId: service.id,
        itemCount: data.itemCount,
        district: data.district,
        streetAddress: data.streetAddress,
        city: data.city?.trim() || 'Goiânia',
        addressRef: data.addressRef || null,
        preferredDate: data.preferredDate,
        timeSlot: data.timeSlot,
        period: data.period ?? null,
        notes: data.notes || null,
        photos: data.photos?.length ? JSON.stringify(data.photos) : null,
        status: 'SOLICITADO',
        privacyAccepted: data.privacyAccepted,
        scheduledAt,
      },
    });

    await notify({
      type: 'AGENDAMENTO',
      title: `Nova solicitação ${protocol}`,
      message: `${data.name} solicitou ${service.name} para ${data.preferredDate} (${data.timeSlot}).`,
      link: `/admin/agendamentos?protocol=${protocol}`,
      bookingId: booking.id,
    });

    const wa = waLink('5562991579369', waMessageBooking(protocol));

    return ok({
      protocol,
      message: 'Solicitação recebida! Nossa equipe vai analisar e confirmar o horário com você.',
      whatsappUrl: wa,
    }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

/** GET /api/agendamento?date=YYYY-MM-DD — janelas disponíveis (auxilia o formulário). */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') ?? '';
    if (!isValidDateStr(date)) return fail('Data inválida (use YYYY-MM-DD).', 422);
    const slots = await availableSlots(date);
    return ok({ date, slots });
  } catch (e) {
    return handleError(e);
  }
}
