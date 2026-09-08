import { getKysely } from '../../db/database.ts';

export async function getSerialPublisherMessageCount(serialPublisherId: number): Promise<number> {
  const db = getKysely();
  const { message_count } = await db
    .selectFrom('serial_message')
    .select(db.fn.countAll<number>().as('message_count'))
    .where('serial_publisher_id', '=', serialPublisherId)
    .executeTakeFirstOrThrow();

  return message_count;
}

export async function getSerialPublisherPublicationCount(serialPublisherId: number): Promise<number> {
  const db = getKysely();
  const { publication_count } = await db
    .selectFrom('serial_publication')
    .select(db.fn.countAll<number>().as('publication_count'))
    .where('serial_publisher_id', '=', serialPublisherId)
    .executeTakeFirstOrThrow();

  return publication_count;
}

export async function getSerialPublisherPublicationRequestCount(serialPublisherId: number): Promise<number> {
  const db = getKysely();
  const { publication_request_count } = await db
    .selectFrom('serial_publication_request')
    .select(db.fn.countAll<number>().as('publication_request_count'))
    .where('serial_publisher_id', '=', serialPublisherId)
    .executeTakeFirstOrThrow();

  return publication_request_count;
}
