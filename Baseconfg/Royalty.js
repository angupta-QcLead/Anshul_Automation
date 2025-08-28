class royaltymodel {

    constructor(config){
        this.config=config;
    }
    //Get Scope A query
     
    ScopeA(){
    const dealsidscope=this.config.deal_sid
     const scopeAquery=`
    SELECT 
    p1.period_id AS [reporting_period],
    p2.period_id AS [actual_period],
    ud2.udkey_2_id AS [activity_type],
    ud1.udkey_1_id AS [Catalog],
    ud4.udkey_4_id AS [Channel],
    ud5.udkey_5_id AS [Territory],
    ud6.udkey_6_id AS [Media],
    ud7.udkey_7_id AS [Language],
    ud8.udkey_8_sid AS [Bundles],
    CAST(d.price_point AS DECIMAL(10,2)) AS [Price1 (Retail Price)],
    CAST(d.qty AS INT) AS [Units],
    CAST(d.amount AS DECIMAL(10,2)) AS [Amount]
FROM 
    x_deal_calc_result d
JOIN 
    x_period p1 ON d.period_sid = p1.period_sid
JOIN 
    x_period p2 ON d.actual_period_sid = p2.period_sid
JOIN 
    c_udkey_2 ud2 ON d.udkey_2_sid = ud2.udkey_2_sid
JOIN 
    c_udkey_1 ud1 ON d.udkey_1_sid = ud1.udkey_1_sid
JOIN 
    c_udkey_4 ud4 ON d.udkey_4_sid = ud4.udkey_4_sid
JOIN 
    c_udkey_5 ud5 ON d.udkey_5_sid = ud5.udkey_5_sid
JOIN 
    c_udkey_6 ud6 ON d.udkey_6_sid = ud6.udkey_6_sid
JOIN 
    c_udkey_7 ud7 ON d.udkey_7_sid = ud7.udkey_7_sid
JOIN 
    c_udkey_8 ud8 ON d.udkey_8_sid = ud8.udkey_8_sid
JOIN 
    c_udkey_3 ud3 ON d.udkey_3_sid = ud3.udkey_3_sid
WHERE 
    d.deal_sid = ${dealsidscope}
    AND p2.period_id = '202301'
    AND ud2.udkey_2_sid IN (1171, 1172, 1173)
    AND ud3.udkey_3_sid = 505;

`;
    
    

    return scopeAquery;
    
}
}
module.exports = { royaltymodel };