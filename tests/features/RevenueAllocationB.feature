Feature: Revenue Allocation B Validation
  As a QA Engineer
  I want to validate RevenueAllocationB SQL results
  So that I can ensure database outputs match known data

  Scenario: Compare RevenueAllocationB SQL results with known baseline
    Given I have a valid RevenueAllocationB SQL query
    When I run the query RevenueB and save the results
    Then RevenueAllocationB results should match the known baseline
