on collectNamedFolders(containerObject, targetName)
  set matches to {}
  tell application "Notes"
    repeat with candidateFolder in folders of containerObject
      if (name of candidateFolder as text) is targetName then set end of matches to candidateFolder
      try
        set nestedMatches to my collectNamedFolders(candidateFolder, targetName)
        repeat with nestedMatch in nestedMatches
          set end of matches to nestedMatch
        end repeat
      end try
    end repeat
  end tell
  return matches
end collectNamedFolders

on writeUtf8(destinationPath, valueToWrite)
  set destinationFile to POSIX file destinationPath
  set openFile to open for access destinationFile with write permission
  try
    set eof openFile to 0
    write valueToWrite to openFile as «class utf8»
    close access openFile
  on error errorMessage number errorNumber
    try
      close access openFile
    end try
    error errorMessage number errorNumber
  end try
end writeUtf8

on paddedOrdinal(ordinalValue)
  set ordinalText to ordinalValue as text
  repeat while (length of ordinalText) < 4
    set ordinalText to "0" & ordinalText
  end repeat
  return ordinalText
end paddedOrdinal

on joinedRecord(valuesToJoin, delimiterCharacter)
  set priorDelimiters to AppleScript's text item delimiters
  set AppleScript's text item delimiters to delimiterCharacter
  set joinedValue to valuesToJoin as text
  set AppleScript's text item delimiters to priorDelimiters
  return joinedValue
end joinedRecord

on stableTimestamp(dateValue)
  return (dateValue as «class isot») as string
end stableTimestamp

on run argv
  if (count of argv) is not 3 then error "Expected folder name, note ID, and private output directory."
  set targetName to item 1 of argv
  set targetNoteId to item 2 of argv
  set outputDirectory to item 3 of argv
  set matchingFolders to {}
  set matchingNotes to {}
  set fieldDelimiter to character id 31
  set recordDelimiter to character id 30
  set outputRecords to {}

  tell application "Notes"
    repeat with noteAccount in accounts
      set accountMatches to my collectNamedFolders(noteAccount, targetName)
      repeat with matchingFolder in accountMatches
        set end of matchingFolders to matchingFolder
      end repeat
    end repeat
    if (count of matchingFolders) is not 1 then error "The exact Apple Notes folder match is not unique."

    repeat with sourceNote in notes of item 1 of matchingFolders
      if (id of sourceNote as text) is targetNoteId then set end of matchingNotes to sourceNote
    end repeat
    if (count of matchingNotes) is not 1 then error "The requested note ID was not found exactly once."

    set sourceNote to item 1 of matchingNotes
    my writeUtf8(outputDirectory & "/title.txt", name of sourceNote as text)
    my writeUtf8(outputDirectory & "/plaintext.txt", plaintext of sourceNote as text)
    my writeUtf8(outputDirectory & "/body.html", body of sourceNote as text)

    set end of outputRecords to my joinedRecord({"E", id of sourceNote as text, my stableTimestamp(modification date of sourceNote), count of attachments of sourceNote as text}, fieldDelimiter)
    set attachmentOrdinal to 0
    repeat with sourceAttachment in attachments of sourceNote
      set attachmentOrdinal to attachmentOrdinal + 1
      set outputPath to outputDirectory & "/attachment-" & my paddedOrdinal(attachmentOrdinal) & ".bin"
      set attachmentSaved to true
      try
        save sourceAttachment in POSIX file outputPath
      on error
        set attachmentSaved to false
      end try
      set contentIdentifier to ""
      try
        set contentIdentifier to content identifier of sourceAttachment as text
      end try
      set end of outputRecords to my joinedRecord({"A", attachmentOrdinal as text, id of sourceAttachment as text, contentIdentifier, my stableTimestamp(creation date of sourceAttachment), my stableTimestamp(modification date of sourceAttachment), attachmentSaved as text}, fieldDelimiter)
    end repeat
  end tell

  return my joinedRecord(outputRecords, recordDelimiter)
end run
