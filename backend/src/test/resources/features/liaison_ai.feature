Feature: Liaison AI scoring
  Liaison AI must distinguish relevant academic PDFs from invalid or irrelevant content.

  Scenario: Publish-ready CS101 academic text receives a high score
    Given a CS101 PDF text containing algorithm course keywords
    When Liaison AI calculates the quality score
    Then the score is high enough to publish

  Scenario: Irrelevant CS101 text receives a low score
    Given a CS101 PDF text without academic course keywords
    When Liaison AI calculates the quality score
    Then the score is below the publish threshold

  Scenario: Liaison AI uses the PyTorch model for scoring
    Given a running PyTorch AI microservice
    And a CS101 PDF text to evaluate
    When the evaluation is triggered
    Then the score returned by the PyTorch service is saved

  Scenario: AI score outside valid range is rejected
    Given a document waits for AI evaluation
    And the AI service returns score 999
    When the evaluation is triggered
    Then the system rejects the document
    And the final score does not use 999
    And the rejection reason mentions invalid AI score

