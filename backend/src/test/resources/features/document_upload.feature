Feature: PDF upload and storage
  The platform must only store valid PDF notes so Liaison AI can review them.

  Scenario: Store a valid PDF for AI review
    Given an authenticated student session
    And the student selected a valid PDF named "algorithms-notes.pdf"
    When the student uploads the file for course "CS101"
    Then the upload API accepts the request
    And the PDF is stored under the configured upload directory
    And document metadata is saved for AI review

  Scenario: Reject an invalid non-PDF upload
    Given an authenticated student session
    And the student selected a non-PDF file named "notes.txt"
    When the student uploads the file for course "CS101"
    Then the upload API rejects the request with "Only PDF files are allowed"
    And no document metadata is saved
