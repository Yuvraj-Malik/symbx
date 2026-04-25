SET SERVEROUTPUT ON;

PROMPT ====== ORACLE DBMS DEMO START ======

DECLARE
  v_match NUMBER;
  v_hazard NUMBER;
BEGIN
  v_match := fn_pair_criteria_match(1, 2);
  v_hazard := fn_offer_hazard_count(1);

  DBMS_OUTPUT.PUT_LINE('Compatibility function result (1=match): ' || v_match);
  DBMS_OUTPUT.PUT_LINE('Hazard count function result: ' || v_hazard);
END;
/

BEGIN
  sp_create_offer_decision(1, 2);
  DBMS_OUTPUT.PUT_LINE('Decision row initialized via procedure.');
END;
/

BEGIN
  sp_respond_offer_decision(1, 2, 1, 'ACCEPTED');
  DBMS_OUTPUT.PUT_LINE('Seller response accepted.');
END;
/

BEGIN
  sp_respond_offer_decision(1, 2, 2, 'ACCEPTED');
  DBMS_OUTPUT.PUT_LINE('Buyer response accepted.');
END;
/

PROMPT ====== FINAL DECISION ======
SELECT offer_listing_id,
       demand_listing_id,
       seller_decision,
       buyer_decision,
       final_status
FROM offer_decisions
WHERE offer_listing_id = 1
  AND demand_listing_id = 2;

PROMPT ====== LISTING STATUS ======
SELECT id, type, status
FROM listings
WHERE id IN (1, 2)
ORDER BY id;

PROMPT ====== REJECT PATH SETUP ======
INSERT INTO listings (user_id, type, material_name, quantity_tons, status)
VALUES (1, 'OFFER', 'Demo Reject Path Offer', 900, 'ACTIVE');

INSERT INTO listings (user_id, type, material_name, quantity_tons, status)
VALUES (2, 'DEMAND', 'Demo Reject Path Demand', 850, 'ACTIVE');

INSERT INTO batch_composition (listing_id, chem_id, percentage)
SELECT l.id, c.id, 56
FROM listings l
JOIN chemicals c ON c.code = 'SIO2'
WHERE l.material_name = 'Demo Reject Path Offer';

INSERT INTO batch_composition (listing_id, chem_id, percentage)
SELECT l.id, c.id, 20
FROM listings l
JOIN chemicals c ON c.code = 'AL2O3'
WHERE l.material_name = 'Demo Reject Path Offer';

INSERT INTO acceptance_criteria (listing_id, chem_id, min_percentage, max_percentage)
SELECT l.id, c.id, 50, NULL
FROM listings l
JOIN chemicals c ON c.code = 'SIO2'
WHERE l.material_name = 'Demo Reject Path Demand';

INSERT INTO acceptance_criteria (listing_id, chem_id, min_percentage, max_percentage)
SELECT l.id, c.id, 15, NULL
FROM listings l
JOIN chemicals c ON c.code = 'AL2O3'
WHERE l.material_name = 'Demo Reject Path Demand';

COMMIT;

DECLARE
  v_offer_id NUMBER;
  v_demand_id NUMBER;
BEGIN
  SELECT id INTO v_offer_id
  FROM listings
  WHERE material_name = 'Demo Reject Path Offer';

  SELECT id INTO v_demand_id
  FROM listings
  WHERE material_name = 'Demo Reject Path Demand';

  sp_create_offer_decision(v_offer_id, v_demand_id);
  sp_respond_offer_decision(v_offer_id, v_demand_id, 1, 'ACCEPTED');
  sp_respond_offer_decision(v_offer_id, v_demand_id, 2, 'REJECTED');

  DBMS_OUTPUT.PUT_LINE('Reject path completed for pair: ' || v_offer_id || ', ' || v_demand_id);
END;
/

PROMPT ====== REJECT DECISION RESULT ======
SELECT od.offer_listing_id,
       od.demand_listing_id,
       od.seller_decision,
       od.buyer_decision,
       od.final_status,
       lo.status AS offer_status,
       ld.status AS demand_status
FROM offer_decisions od
JOIN listings lo ON lo.id = od.offer_listing_id
JOIN listings ld ON ld.id = od.demand_listing_id
WHERE od.offer_listing_id = (
  SELECT id FROM listings WHERE material_name = 'Demo Reject Path Offer'
)
AND od.demand_listing_id = (
  SELECT id FROM listings WHERE material_name = 'Demo Reject Path Demand'
);

PROMPT ====== ORACLE DBMS DEMO END ======
