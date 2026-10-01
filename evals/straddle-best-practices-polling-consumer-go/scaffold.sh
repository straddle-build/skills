#!/usr/bin/env bash
set -euo pipefail
mkdir -p consumer
cat > go.mod <<'MOD'
module example.com/ledger

go 1.22
MOD
cat > consumer/store.go <<'GO'
package consumer

import "context"

// Store saves events. SaveBatch inserts them in order in one transaction,
// skipping event IDs already stored, and returns an error when nothing was saved.
type Store interface {
	SaveBatch(ctx context.Context, events []Event) error
}

type Event struct {
	EventID   string
	EventType string
	AccountID string
	Body      []byte
}
GO
