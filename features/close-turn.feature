Feature: Close turn
  Scenario: Daily cutoff closes the active turn
    Given an active turn
    And a submitted prompt
    And the cutoff has passed
    When the cutoff job runs
    Then the turn is closed and voting is frozen
