-- ============================================================
-- MIGRATION: 20260330000004_seed_data.sql
-- PharmaControl — Default Message Templates
-- ============================================================

-- WhatsApp reminder template (one per pharmacy)
INSERT INTO message_templates (pharmacy_id, name, channel, body, is_default, variables)
SELECT id,
  'Lembrete de Recompra — WhatsApp',
  'whatsapp',
  'Olá, {{customer_name}}! 👋

Está chegando a hora de renovar seu {{product_name}}.

Seu ciclo de uso indica que o produto deve estar se esgotando em breve. Garantir a continuidade do seu tratamento é muito importante!

Entre em contato: 📞 {{pharmacy_phone}}
🏥 {{pharmacy_name}}

Responda PARAR para cancelar os lembretes.',
  TRUE,
  ARRAY['customer_name','product_name','pharmacy_name','pharmacy_phone']
FROM pharmacies;

-- Email reminder template (one per pharmacy)
INSERT INTO message_templates (pharmacy_id, name, channel, subject, body, is_default, variables)
SELECT id,
  'Lembrete de Recompra — E-mail',
  'email',
  'Hora de renovar seu {{product_name}} — {{pharmacy_name}}',
  '<p>Olá, <strong>{{customer_name}}</strong>!</p>
<p>Seu produto <strong>{{product_name}}</strong> deve estar chegando ao fim.</p>
<p>Entre em contato para garantir a continuidade do seu tratamento.</p>
<br/><p><strong>{{pharmacy_name}}</strong><br/>
📞 {{pharmacy_phone}} | ✉️ {{pharmacy_email}}</p>',
  TRUE,
  ARRAY['customer_name','product_name','pharmacy_name','pharmacy_phone','pharmacy_email']
FROM pharmacies;
