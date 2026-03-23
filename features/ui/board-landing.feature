Feature: Board landing
  Scenario: Anonymous visitor opens the board homepage
    Given the UI world is reset
    When the visitor opens the board page
    Then the live board stage is ready
    And the hero copy and prompt teaser are visible
