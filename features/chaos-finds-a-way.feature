Feature: Chaos finds a way
  Scenario: Even a ridiculous winning prompt becomes canon
    Given an active turn
    And a signed-in user
    And a wildly chaotic prompt
    And the cutoff has passed
    And the automation mode is enabled
    When the automation cutoff job runs
    Then the winning prompt is resolved and executed automatically
    And the latest lore mentions chaos
