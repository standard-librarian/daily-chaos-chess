Feature: Moderate prompt
  Scenario: Admin rejects a problematic prompt
    Given an active turn
    And a submitted prompt
    When an admin rejects the prompt
    Then the prompt becomes rejected
