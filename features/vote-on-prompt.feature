Feature: Vote on prompt
  Scenario: Signed-in user votes once per turn
    Given an active turn
    And a signed-in user
    And a submitted prompt
    When the user votes for that prompt
    And the same user votes for that prompt again
    Then the vote tally updates
    And duplicate voting is prevented
