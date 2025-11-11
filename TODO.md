# TODO List for Team Events Feature

## 1. Modify ScoreSheetEntry Component (scoreboard-control.tsx)
- [x] Add event type dropdown (Individual/Team)
- [x] For Individual: Keep current form, add optional points input per winner
- [x] For Team: New form with event dropdown (Football, Basketball, etc.), team name input, school dropdown, points input
- [x] Update state management for conditional rendering

## 2. Update Save Score API (save-score/route.ts)
- [x] Add EventType field to request body
- [x] For teams: Save Points, TeamName, EventName from list, SchoolName
- [x] For individuals: Save Position, ChestNo, StudentName, SchoolName, optional Points
- [x] Update DynamoDB schema accordingly

## 3. Update Fetch School Scores API (fetch-school-scores/route.ts)
- [x] Modify point calculation: Use Points if provided, else position-based for individuals
- [x] For teams: Always use Points
- [x] Update recentWinners to handle team data

## 4. Fix Delete Winner API (delete-winner/route.ts)
- [x] Investigate why delete doesn't work
- [x] Update logic to handle team events if needed

## 5. Testing
- [x] Build compilation successful
- [x] TypeScript type checking passed
- [x] Linting passed
- [ ] Manual testing of individual events with manual points (requires user testing)
- [ ] Manual testing of team events (requires user testing)
- [ ] Manual testing of delete functionality (requires user testing)
- [ ] Manual verification of score calculations (requires user testing)
