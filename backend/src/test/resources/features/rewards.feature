# FR-ST-33: CampusCoin Reward System
# Rule: Users are awarded coins equal to AKTS * 10 when a document is published.

Feature: CampusCoin Rewards
  Scenario: Award coins based on AKTS
    Given a user with 100 coins
    And a document with 5 AKTS
    When the document is successfully published
    Then the user should have 150 coins (100 + 5*10)
