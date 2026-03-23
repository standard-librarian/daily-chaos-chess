Feature: Submit prompt
  Scenario: Signed-in user submits a new prompt
    Given an active turn
    And a signed-in user
    When the user submits a prompt
    Then the prompt appears in the feed with zero votes
