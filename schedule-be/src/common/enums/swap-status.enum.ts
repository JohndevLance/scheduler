export enum SwapStatus {
  PENDING_ACCEPTANCE = 'pending_acceptance', // waiting for target staff to accept
  PENDING_APPROVAL = 'pending_approval', // accepted, waiting for manager
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum SwapType {
  SWAP = 'swap', // exchange shifts between two staff
  DROP = 'drop', // offer shift to anyone qualified
}
