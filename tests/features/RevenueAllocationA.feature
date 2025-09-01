Feature: Revenue Allocation A Validation
  As a QA Engineer
  I want to validate RevenueAllocationA SQL results
  So that I can ensure database outputs match known data

  Scenario: Compare RevenueAllocationA SQL results with known baseline
    Given I have a valid RevenueAllocationA SQL query
    When I run the query and save the results
    Then the results should match the known baseline
