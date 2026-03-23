Feature: Auto execute after cutoff
  Scenario: Automation runs the full pipeline
    Given an active turn
    And a signed-in user
    And a submitted prompt
    And the cutoff has passed
    And the automation mode is enabled
    When the automation cutoff job runs
    Then the winning prompt is resolved and executed automatically
