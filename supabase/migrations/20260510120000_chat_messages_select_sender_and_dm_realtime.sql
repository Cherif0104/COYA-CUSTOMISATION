-- DM / messagerie : lecture garantie pour l’expéditeur (RETURNING après INSERT, reload UI).
-- Les fonctions chat_user_can_see_channel / chat_direct_user_is_thread_member viennent de 20260401140000.

begin;

drop policy if exists chat_messages_select on public.chat_messages;

create policy chat_messages_select
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.organization_id = chat_messages.organization_id
    )
    and (
      chat_messages.sender_id = (
        select pr.id from public.profiles pr where pr.user_id = auth.uid() limit 1
      )
      or (
        chat_messages.channel_id is not null
        and public.chat_user_can_see_channel(chat_messages.channel_id)
      )
      or (
        chat_messages.direct_thread_id is not null
        and public.chat_direct_user_is_thread_member(chat_messages.direct_thread_id)
      )
    )
  );

commit;
