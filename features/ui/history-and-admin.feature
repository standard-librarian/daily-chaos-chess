Feature: History and admin canon pipeline
  Scenario: A visitor can browse the history archive
    Given the UI world is reset with an executed turn
    When the visitor opens the board page
    And the visitor navigates to the history page
    Then the history cards are visible
    And the latest history includes an executed turn

  Scenario: Admin adjudicates a turn and the board reflects the new day
    Given the UI world is reset
    When the visitor opens the board page
    And the visitor signs in as "Alice"
    And the user submits the prompt "Move the white queen toward the center"
    And the user signs out
    And the visitor signs in as admin "Admin"
    And the visitor navigates to the admin page
    Then the admin controls are visible
    When the admin force closes the current turn
    Then the status banner says "Turn closed and winner locked in."
    And the admin sees the winning prompt for "Move the white queen toward the center"
    When the admin approves the suggested action script
    Then the status banner says "Action script approved."
    When the admin executes the resolved turn
    Then the status banner says "Resolved turn executed."
    When the admin toggles the automation mode
    Then the status banner says "Automation mode updated."
    And the automation mode reflects "auto_execute"
    When the visitor navigates to the history page
    Then the history cards are visible
    And the latest history includes an executed turn
    When the visitor returns to the board page
    Then the board feed advances to day 2
