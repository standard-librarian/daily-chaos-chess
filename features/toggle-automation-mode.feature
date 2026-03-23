Feature: Toggle automation mode
  Scenario: Admin enables auto execution
    Given an active turn
    When an admin switches to auto execute
    Then future turns use auto execute mode
