Feature: Scope A comparing known and Test file and find difference

  
  As a QA Engineer
  I want to validate Scope A SQL results
  So that I can ensure database outputs match known data

  Scenario: Compare Scope A SQL results with known baseline
    Given I have a valid ScopeA SQL query
    When I run the Scope A query and save the results
    Then ScopeA results should match the known baseline

    
