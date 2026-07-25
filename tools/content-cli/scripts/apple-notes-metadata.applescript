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
  if (count of argv) is not 1 then error "Expected an exact Apple Notes folder name."
  set targetName to item 1 of argv
  set fieldDelimiter to character id 31
  set recordDelimiter to character id 30
  set outputRecords to {}
  set matchingFolders to {}

  tell application "Notes"
    repeat with noteAccount in accounts
      set accountMatches to my collectNamedFolders(noteAccount, targetName)
      repeat with matchingFolder in accountMatches
        set end of matchingFolders to {noteAccount, matchingFolder}
      end repeat
    end repeat

    repeat with matchPair in matchingFolders
      set noteAccount to item 1 of matchPair
      set noteFolder to item 2 of matchPair
      set folderShared to false
      try
        set folderShared to shared of noteFolder
      end try
      set end of outputRecords to my joinedRecord({"F", id of noteAccount as text, id of noteFolder as text, folderShared as text, count of notes of noteFolder as text}, fieldDelimiter)

      repeat with sourceNote in notes of noteFolder
        set noteLocked to false
        set noteShared to false
        try
          set noteLocked to password protected of sourceNote
        end try
        try
          set noteShared to shared of sourceNote
        end try
        set end of outputRecords to my joinedRecord({"N", id of sourceNote as text, my stableTimestamp(creation date of sourceNote), my stableTimestamp(modification date of sourceNote), noteLocked as text, noteShared as text, count of attachments of sourceNote as text}, fieldDelimiter)

        set attachmentOrdinal to 0
        repeat with sourceAttachment in attachments of sourceNote
          set attachmentOrdinal to attachmentOrdinal + 1
          set contentIdentifier to ""
          try
            set contentIdentifier to content identifier of sourceAttachment as text
          end try
          set end of outputRecords to my joinedRecord({"A", id of sourceNote as text, attachmentOrdinal as text, id of sourceAttachment as text, contentIdentifier, my stableTimestamp(creation date of sourceAttachment), my stableTimestamp(modification date of sourceAttachment)}, fieldDelimiter)
        end repeat
      end repeat
    end repeat
  end tell

  return my joinedRecord(outputRecords, recordDelimiter)
end run
