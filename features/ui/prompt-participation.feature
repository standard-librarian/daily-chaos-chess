Feature: Prompt participation
  Scenario: A visitor signs in, submits a prompt, and signs out
    Given the UI world is reset
    When the visitor opens the board page
    And the visitor signs in as "Alice"
    Then the signed in state for "Alice" is visible
    When the user submits the prompt "Summon a side board through a portal behind the black queen."
    Then the status banner says "Prompt submitted to the canon feed."
    And the prompt "Summon a side board through a portal behind the black queen." appears with 0 votes
    When the user signs out
    Then the status banner says "Signed out."
    And the anonymous sign-in form is visible again

  Scenario: Empty prompt submission shows an error
    Given the UI world is reset
    When the visitor opens the board page
    And the visitor signs in as "Alice"
    And the user submits an empty prompt
    Then the status banner says "Prompt text cannot be empty."

  Scenario: A second visitor votes and duplicate voting is rejected
    Given the UI world is reset
    When the visitor opens the board page
    And the visitor signs in as "Alice"
    And the user submits the prompt "Open a portal behind the king"
    And a second visitor named "Bob" signs in and votes for "Open a portal behind the king"
    Then the status banner says "Vote recorded."
    And the prompt "Open a portal behind the king" appears with 1 votes
    When the same visitor votes for "Open a portal behind the king" again
    Then the status banner says "You already voted in this turn."
