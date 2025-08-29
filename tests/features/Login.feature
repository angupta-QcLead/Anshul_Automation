feature: Login

  Scenario: User logs in with valid credentials
    Given I navigate to the login page
    When I enter username "student" and password "Password123"
    Then I should see the dashboard