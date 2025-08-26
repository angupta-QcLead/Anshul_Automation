class Revenuemodel {

  constructor(config) {
    this.config = config;
  }

  // Get RevenueAllocation query A
  RevenueAllocationA() {
  const dealSid = this.config.deal_sid;
  return `
    SELECT 
      p1.period_id AS reportingperiod,
      p2.period_id AS actualperiod,
      a3.udkey_2_id AS ActivityType,
      a1.udkey_1_id AS CatlogType,
      t1.udkey_5_id AS Territory,
      t2.udkey_6_id AS Media,
      a4.udkey_7_id AS Language,
      b1.udkey_8_id AS Bundle,
      qty as unit,
      price_point as Price1Retailprice,
      user_3_rate,
      amount as Amount
    FROM x_deal_calc_result d
    JOIN x_period p1 ON d.period_sid = p1.period_sid
    JOIN x_period p2 ON d.actual_period_sid = p2.period_sid
    JOIN c_udkey_1 a1 ON d.udkey_1_sid = a1.udkey_1_sid
    JOIN c_udkey_2 a3 ON d.udkey_2_sid = a3.udkey_2_sid
    JOIN c_udkey_4 a2 ON d.udkey_4_sid = a2.udkey_4_sid
    JOIN c_udkey_5 t1 ON d.udkey_5_sid = t1.udkey_5_sid
    JOIN c_udkey_6 t2 ON d.udkey_6_sid = t2.udkey_6_sid
    JOIN c_udkey_7 a4 ON d.udkey_7_sid = a4.udkey_7_sid
    JOIN c_udkey_8 b1 ON d.udkey_8_sid = b1.udkey_8_sid
    WHERE d.deal_sid = ${dealSid}
    ORDER BY CatlogType ASC;
  `;
}
// Get RevenueAllocation query B
  RevenueAllocationB() {
  const dealSidB = this.config.deal_sid;
  return `
    SELECT 
      p1.period_id AS reportingperiod,
      p2.period_id AS actualperiod,
      a3.udkey_2_id AS ActivityType,
      a1.udkey_1_id AS CatlogType,
      t1.udkey_5_id AS Territory,
      t2.udkey_6_id AS Media,
      a4.udkey_7_id AS Language,
      b1.udkey_8_id AS Bundle,
      qty as unit,
      price_point as Price1Retailprice,
      user_3_rate,
      amount as Amount
    FROM x_deal_calc_result d
    JOIN x_period p1 ON d.period_sid = p1.period_sid
    JOIN x_period p2 ON d.actual_period_sid = p2.period_sid
    JOIN c_udkey_1 a1 ON d.udkey_1_sid = a1.udkey_1_sid
    JOIN c_udkey_2 a3 ON d.udkey_2_sid = a3.udkey_2_sid
    JOIN c_udkey_4 a2 ON d.udkey_4_sid = a2.udkey_4_sid
    JOIN c_udkey_5 t1 ON d.udkey_5_sid = t1.udkey_5_sid
    JOIN c_udkey_6 t2 ON d.udkey_6_sid = t2.udkey_6_sid
    JOIN c_udkey_7 a4 ON d.udkey_7_sid = a4.udkey_7_sid
    JOIN c_udkey_8 b1 ON d.udkey_8_sid = b1.udkey_8_sid
    WHERE d.deal_sid = ${dealSidB}
    ORDER BY CatlogType ASC;
  `;
}

}

module.exports = { Revenuemodel };
