export type Performer = {
  userId: string
  organizationId: string
  role: PerformerRole
}

export enum PerformerRole {
  Admin = 'admin',
  User = 'user',
  Candidate = 'candidate',
}
