Feature: Replay turn changes
  Scenario: Visitor inspects a stored turn replay
    Given a resolved turn
    When the system executes the resolved turn
    And the visitor browses history
    And the visitor replays the executed turn
    Then the visitor can inspect the stored replay data
