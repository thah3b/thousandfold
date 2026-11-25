-- Thousandfold v0.13 (Phase 12): three Secrets achievements raise the achievement-point total.
update public.tf_config set value = 2010 where key = 'ach_max';
