-- Booking states of the brief: inquiry (consulta), pending (pendiente), confirmed, checked_in (en curso), checked_out (finalizada), canceled.
-- Own migration: a new enum value cannot be used in the transaction that adds it.
alter type public.booking_status add value if not exists 'inquiry';
alter type public.booking_status add value if not exists 'pending';
