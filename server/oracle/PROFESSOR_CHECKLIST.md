# Professor DBMS Checklist (Backend)

Use this file to demonstrate that required DBMS artifacts are implemented in Oracle PL/SQL.

## 1) Procedure(s)

- sp_create_offer_decision
  - Purpose: initializes offer-demand decision workflow row after compatibility check.
  - File: schema_oracle.sql

- sp_respond_offer_decision
  - Purpose: records seller/buyer response and finalizes outcome.
  - Rules:
    - both ACCEPTED -> both listings CLOSED
    - either REJECTED -> listings remain ACTIVE
  - File: schema_oracle.sql

## 2) Function(s)

- fn_offer_hazard_count
  - Returns number of incompatible chemical pairs in an OFFER listing.
  - File: schema_oracle.sql

- fn_pair_criteria_match
  - Returns 1 if OFFER satisfies all DEMAND criteria, otherwise 0.
  - File: schema_oracle.sql

## 3) Cursor Usage

- Explicit cursor cur_criteria inside fn_pair_criteria_match.
- Iterates demand criteria and validates offer composition entry-by-entry.
- File: schema_oracle.sql

## 4) Trigger

- trg_offer_decisions_updated_at
  - BEFORE UPDATE trigger on offer_decisions.
  - Automatically updates updated_at timestamp.
  - File: schema_oracle.sql

## 5) End-to-End Demo

- demo_oracle_plsql.sql runs:
  - Function calls for compatibility and hazard count.
  - Procedure-driven ACCEPT path validation.
  - Procedure-driven REJECT path validation.

## 6) Run Commands (SQLcl / SQL*Plus)

@server/oracle/schema_oracle.sql
@server/oracle/demo_oracle_plsql.sql

## 7) Expected Outcomes

- ACCEPT demo pair final_status = ACCEPTED and both listings CLOSED.
- REJECT demo pair final_status = REJECTED and both listings ACTIVE.
