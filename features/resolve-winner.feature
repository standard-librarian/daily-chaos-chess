Feature: Resolve winner
  Scenario: Admin approves an action script for the winning prompt
    Given a closed turn with a winning prompt
    When an admin approves an action script
    Then a resolved turn stores the action script
