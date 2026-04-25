# Oracle DBMS Compliance Pack

This folder provides Oracle SQL and PL/SQL objects for professor-level DBMS requirements.

## Files

- schema_oracle.sql
  - Creates Oracle tables and constraints for Symbio-Exchange backend core entities.
  - Includes required PL/SQL artifacts:
    - Trigger: trg_offer_decisions_updated_at
    - Function: fn_offer_hazard_count
    - Function with explicit cursor: fn_pair_criteria_match
    - Procedure: sp_create_offer_decision
    - Procedure: sp_respond_offer_decision

- demo_oracle_plsql.sql
  - Runs complete acceptance and rejection flows using PL/SQL procedure calls.
  - Prints function outputs and final row statuses for both outcomes.

## Run Order (SQL*Plus / SQLcl)

1. Run schema and PL/SQL objects:

   @server/oracle/schema_oracle.sql

2. Run demo block:

   @server/oracle/demo_oracle_plsql.sql

## Professor Checklist Coverage

- Procedures: yes (sp_create_offer_decision, sp_respond_offer_decision)
- Functions: yes (fn_offer_hazard_count, fn_pair_criteria_match)
- Cursor: yes (explicit cursor cur_criteria inside fn_pair_criteria_match)
- Trigger: yes (trg_offer_decisions_updated_at)

## Notes

- Current Node backend remains SQLite runtime for day-to-day API usage.
- This Oracle pack is structured to map directly to the same marketplace flow used by the backend.
