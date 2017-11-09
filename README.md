MarkupProject: Completion
=========================

Challenge Overview
---------------
Create a class in the language of your choice that will read HTML content input and score and give
an arbitrary score based on a set of rules. The content should be assigned a unique id based on the prefix described below.
Changes to the content can be re-run over time to determine improvement or regression of the score. Each unique run should be stored with the date and time it was run along with the score received for the content.

You may use external libraries if you feel they will help, but you must place them in the appropriate folder based on the project layout section.


Getting the App to Run
----------------------
>**Languages and tools used:**
>
>- Node v8.1.4
>- NPM v5.0.3
>- MySQL 5.7.19
>- Atom as my IDE
>- macOS High Sierra
>- Google Chrome 60.0.3112.113 as my primary browser
>
>**Instructions**
>
>1. Start a local SQL server instance (I used 'mysql.server start' in the Terminal).
>2. Run the command : mysql -u (username here) -p"(password here)" < ./schema/markup_db.sql
>3. Navigate to the src/ directory
>4. Edit lines 31 and 32 of server.js to your MySQL username and password
>4. run `npm install`
>4. return to root, and run `node ./src/server.js`
>5. Navigate to Chrome browser to http://localhost:3000
>6. Enter username "test" and password "test"
>7. Upload an HTML file of your choosing from ./data. The files located under ./data will all be processed when the Score button is clicked.
>8. Once the Scorer has been run once, the Sort, Filter and Search functionality will return data.
>9. http://localhost:3000/main automatically averages the scores.
>10. Once the review is over, click Logout to end user session.
>11. Other combinations of usernames and passwords that can be used: "abc, 123", "def, 456"


If I had more time... (TODO)
----------------------------
Due to a wedding this past weekend followed by a weeklong trip to Iceland, I had to fit in this project into the small timeframe that I had. That said, if I had more time, I would:
>- Parse multiple sections of the HTML content at the same time for performance
>- Added layers of security to prevent SQL Injections, etc (I was having issues with implementing an escape for SQL meta-characters)
>- Massive improvements to UI/UX
>- Added a sign up page for new users to be added to the database
>- Refactored my code for cleaner presentation


Thanks and I hope you enjoyed my code!
======================================

//Michelle
