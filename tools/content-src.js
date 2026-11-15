// Source of truth for the app's teaching content. Run: node content-src.js -> app/data/content.json
const fs = require('fs');
const titles = require('./catalogue.js');
const ids = JSON.parse(fs.readFileSync(__dirname + '/ids.json', 'utf8'));

const stages = [
  { n: 1, name: 'Red', range: '0 to 5', colour: '#E5484D', big: 'Counting, seeing small numbers, more and fewer, parts of 5, one more and one less, zero' },
  { n: 2, name: 'Orange', range: '6 to 10', colour: '#F0862C', big: 'Five and a bit, bonds to 10, doubles, odd and even, numerals, shape, pattern and measures' },
  { n: 3, name: 'Yellow', range: '11 to 20', colour: '#E9B824', big: 'Ten and a bit, place value, arrays, square and step numbers, bridging 10, sharing and grouping' },
  { n: 4, name: 'Green', range: '21 to 50', colour: '#37A55B', big: 'Rectangles and factors, counting in 10s and 5s, the 3, 4 and 5 times tables' },
  { n: 5, name: 'Blue', range: '51 to 100+', colour: '#2F7FE0', big: 'Numbers to 100 and beyond, tens and ones, 6 to 9 times tables, fractions' },
];

// Provisional placements (title/synopsis only) — flagged in the app
const provisional = new Set([
  'S6E1','S6E2','S6E3','S6E4','S6E5','S6E6','S6E7','S6E8','S6E9','S6E10','S6E11','S6E12','S6E13','S6E14','S6E15',
  ...Array.from({ length: 15 }, (_, i) => 'S5E' + (i + 16)),
  ...Array.from({ length: 15 }, (_, i) => 'S7E' + (i + 1)),
  ...Array.from({ length: 30 }, (_, i) => 'S8E' + (i + 1)),
]);

// u(id, stage, title, idea, episodes, extras, checks, prompts, activity{materials, steps}, ncf, nipun)
const units = [];
const u = (id, stage, title, idea, episodes, extras, checks, prompts, activity, ncf, nipun, kind = 'core') =>
  units.push({ id, stage, kind, title, idea, episodes, extras, checks, prompts, activity, ncf, nipun });

// ---------------- Stage 1 ----------------
u('1.1', 1, 'Meet One to Three', 'Each number is a group of that many blocks.',
  ['S1E1','S1E2','S1E3','S1E4','S1E5'], [],
  ['Gives you 1, 2 or 3 objects when asked', 'Says which of two small groups has more'],
  ['How many blocks is Two made of? Show me with your fingers.', 'Three came along. Is Three more or less than Two?', 'What happens when One joins Two?'],
  { materials: 'Building blocks or cubes; a small bowl', steps: ['Build One, Two and Three as towers.', 'Ask her to hand you "two blocks", then "three".', 'Put 2 and 3 side by side: which tower has more?'] },
  ['C-8.3 A', 'C-8.5 A'], ['BV-1', 'BV-3']);
u('1.2', 1, 'Four and Five', 'Counting tells us how many; the last number we say is the answer.',
  ['S1E6','S1E7','S1E8','S1E9'], ['NS4','NS5','NS10'],
  ['Counts 5 objects and answers "how many?" with the last number', 'Orders towers 1 to 5 and finds a missing one'],
  ['Four is a square. Can you make a square with 4 blocks?', 'Five has a hand. How many fingers are on one hand?', 'Which number is missing: 1, 2, _, 4, 5?'],
  { materials: 'Blocks; 5 small toys', steps: ['Build towers 1 to 5 and line them up like a staircase.', 'Hide one tower; she finds which is missing.', 'Count 5 toys together, then ask "so how many?"'] },
  ['C-8.3 B', 'C-8.4 B', 'C-8.5 B'], ['BV-1', 'BV-3', 'BV-4']);
u('1.3', 1, 'How counting works', 'One number word for each thing, in the same order every time; moving things does not change how many.',
  ['S1E10','S1E11'], ['NS3'],
  ['Says a rearranged group is still the same number', 'Recognises 1 to 4 dots without counting'],
  ['Does Three change if she stands in a line or a triangle?', 'How did you know it was four so quickly?'],
  { materials: 'Five buttons; dot cards or a dice', steps: ['Count 5 buttons in a line, then spread them out: "How many now?"', 'Flash dice faces 1 to 4 for a second each; she says the number.', 'Let her be the teacher and catch you miscounting.'] },
  ['C-8.3 B', 'C-8.3 C'], ['BV-1']);
u('1.4', 1, 'Inside 1 to 5', 'Numbers are made of smaller numbers: 5 can be 4 and 1, or 3 and 2.',
  ['S1E12','S1E13','S3E3','S3E4'], [],
  ['Splits 5 blocks two different ways and names the parts'],
  ['Five split into two parts. What were the parts?', 'Can you make Four out of two Twos?', 'Is there another way to split Five?'],
  { materials: 'A tower of 5 linking cubes', steps: ['Snap the tower of 5 into two pieces.', 'Say the parts together: "3 and 2 make 5".', 'Find as many ways as you can and lay them out in a pattern.'] },
  ['C-8.6 A', 'C-8.6 B'], ['BV-1', 'C1-3']);
u('1.5', 1, 'One more, one less, none', 'Adding one makes the next number; taking one away makes the one before; nothing at all is zero.',
  ['S1E14','S1E15','S3E2','S3E5'], ['NS1'],
  ['Says one more and one less for numbers up to 5', 'Uses "zero" for an empty set and "more"/"fewer" correctly'],
  ['Three fell in a hole and lost a block. Who did she become?', 'If there are no blocks left, what number is that?', 'Who is bigger, Two or Four? How do you know?'],
  { materials: 'Blocks; a cup to hide blocks under', steps: ['Show 3 blocks, hide one under the cup: "How many now?"', 'Add one back: "One more than 2 is…?"', 'Take all away: "How many blocks are left?" (zero)'] },
  ['C-8.6 B', 'C-8.3 C', 'C-8.12 B'], ['BV-3']);
u('1.R', 1, 'Stage 1 review', 'A mixed look back at numbers 0 to 5.',
  ['S3E1'], [],
  ['Counts, compares and splits numbers to 5 in a mixed game'],
  ['Which Numberblock is your favourite and what can it do?', 'Show me Four in two different ways.'],
  { materials: 'Blocks; a dice', steps: ['Roll the dice: she builds that Numberblock.', 'Ask one question each time: one more? one less? split it?', 'Swap roles: she asks you.'] },
  ['C-8.3 B', 'C-8.6 B'], ['BV-1', 'BV-3']);

// ---------------- Bridge B3 (after 1.5) ----------------
u('B3', 1, 'Sort and classify', 'Things can be grouped by colour, shape, size — and we can say our rule.',
  [], ['S8E16','S8E19'],
  ['Sorts objects by one property and says the rule', 'Sorts by two properties (e.g. colour, then size)'],
  ['What rule did you use?', 'Can you sort the same things a different way?'],
  { materials: 'Mixed buttons, blocks or kitchen items', steps: ['Sort by colour and name the groups.', 'Mix them up; sort again by size.', 'You sort secretly; she guesses your rule.'] },
  ['C-8.1 A', 'C-8.1 B', 'C-8.1 C'], ['BV-5'], 'bridge');

// ---------------- Stage 2 ----------------
u('2.1', 2, 'Meet Six to Ten', 'Numbers keep growing one block at a time, up to Ten.',
  ['S2E1','S2E2','S2E3','S2E4','S2E5','S3E6','S3E7'], [],
  ['Counts 10 objects reliably', 'Recognises dice and ten-frame patterns to 10'],
  ['Six likes dice. Show me six on a dice.', 'Ten is made of how many Ones?', 'Nine looks like a square. How many on each side?'],
  { materials: 'Ten-frame (draw one on paper); counters', steps: ['Fill the ten-frame one counter at a time, counting aloud.', 'Make 7 on the frame; ask how many empty spaces.', 'Build Six to Ten as towers and line them up.'] },
  ['C-8.3 C', 'C-8.5 C'], ['BV-1', 'BV-2']);
u('2.2', 2, 'Counting on and back', 'Counting forwards adds one each time; counting back takes one away.',
  ['S2E6','S2E7','S2E15','S2E13'], ['NS2','NS9'],
  ['Counts back from 10 to 0', 'Says one more and one less within 10', 'Counts in 2s to 10'],
  ['Blast off! Count down from 10 with me.', 'If we start at 6 and add one, where do we land?', 'Two goes up the tree in jumps of 2. Where does she land?'],
  { materials: 'A number track 0–10 (chalk on the floor or paper)', steps: ['She jumps along the track counting on from any number.', 'Count back to 0 for a rocket launch.', 'Jump in 2s: 0, 2, 4, 6, 8, 10.'] },
  ['C-8.3 C', 'C-8.3 D'], ['BV-1', 'C1-3']);
u('2.3', 2, 'Comparing to 10', 'We can say which number is greater and find how many more.',
  ['S3E9','S3E11','S5E1'], [],
  ['Says which of two numbers to 10 is greater or less', 'Finds the difference between two towers'],
  ['Which tower is taller? By how many blocks?', 'Is 8 greater than or less than 6?'],
  { materials: 'Blocks; a number line 0–10', steps: ['Build two towers; she says which is greater.', 'Line them up and count the extra blocks: that is the difference.', 'Find both numbers on the number line.'] },
  ['C-8.5 C', 'C-8.4 E'], ['BV-3', 'BV-4']);
u('2.4', 2, 'Five and a bit; bonds to 10', 'Six to nine are five and a bit; pairs of numbers make ten.',
  ['S3E13','S3E10','S2E12','S2E14','S3E14','S3E15','S5E3','S3E12','S6E14'], ['S8E14','S8E15','NS7'],
  ['Sees 7 as 5 and 2 without counting', 'Says the partner to make 10 for any number'],
  ['Seven is Five and…?', 'Ten split in two. What were the parts?', 'If 6 are hiding, how many are showing out of 10?'],
  { materials: 'Ten-frame and two colours of counters; or 10 fingers', steps: ['Show 7 on fingers: one full hand and 2.', 'Fill the ten-frame with two colours and say the pair (6 and 4).', 'Hide some of 10 under a cloth; she says how many are hidden.'] },
  ['C-8.6 C', 'C-8.6 D'], ['C1-3']);
u('2.5', 2, 'Equal groups, doubles, odd and even', 'Numbers can be split into equal groups; even numbers make pairs, odd numbers have one left over.',
  ['S2E8','S2E9','S2E10','S2E11','S6E4'], ['S8E7','S8E11','S8E12','SP1'],
  ['Says doubles up to 5 + 5', 'Sorts numbers to 10 into odd and even by pairing blocks'],
  ['Double Two is…?', 'Can Seven make pairs? Who is left over?', 'Nine made three groups of three. Show me.'],
  { materials: 'Blocks or socks', steps: ['Pair up socks or blocks: any left over? Then it is odd.', 'Build a double with two equal towers and count them.', 'Share 6 blocks between 2 teddies, then 3 teddies.'] },
  ['C-8.7 B', 'C-8.7 C', 'C-8.2 C'], ['C1-3', 'C2-3']);
u('2.6', 2, 'Numerals and quick recognition', 'Each number has a written shape we can read and write.',
  ['S5E2','S5E4'], ['NS8'],
  ['Reads and writes 0 to 9', 'Names small quantities on sight'],
  ['Which numeral is that?', 'Can you write Five in the air, then on paper?'],
  { materials: 'Paper, crayon; sand or salt tray', steps: ['Trace numerals 0–9 in sand.', 'Match numeral cards to groups of objects.', 'Write the number of something in the room (chairs, windows).'] },
  ['C-8.5 C', 'C-8.5 D'], ['BV-2', 'C1-2']);
u('2.7', 2, 'Shape, space and pattern', 'Shapes have sides and corners; patterns repeat.',
  ['S3E8','S3E16','S6E6','S6E7','S6E8','S6E9','S6E10','S3E17','S6E15'], ['SP2'],
  ['Names common 2D and 3D shapes', 'Uses position words (on, under, behind, between)', 'Continues a repeating pattern'],
  ['How many corners does a triangle have?', 'What shape is a ball? A box?', 'What comes next in red, blue, red, blue…?'],
  { materials: 'Paper shapes; boxes, balls and tins from the kitchen', steps: ['Shape hunt: find 3 circles and 3 rectangles at home.', 'Hide a toy and give position clues.', 'Make a bead or block pattern; she continues it.'] },
  ['C-8.8 B', 'C-8.8 C', 'C-8.8 D', 'C-8.8 E', 'C-8.2 A', 'C-8.2 D'], ['BV-4', 'C1-4', 'C2-5', 'C2-6', 'C3-5']);
u('2.8', 2, 'Measures and money', 'We can compare how long or heavy things are, and use coins to pay.',
  ['S6E12','S6E13','S6E11'], ['S8E5'],
  ['Compares two lengths or weights directly', 'Pays a small amount with coins'],
  ['Which is taller, you or the door handle?', 'Which is heavier — how could we find out?'],
  { materials: 'String; two bags; a few coins', steps: ['Compare two objects by standing them side by side.', 'Hold one bag in each hand: which is heavier?', 'Play a tiny shop with toys priced 1 to 5.'] },
  ['C-8.9 B', 'C-8.9 C', 'C-8.11 B'], ['BV-6', 'C1-5']);

// Bridges after 2.8
u('B1', 2, 'Money in rupees', 'Indian coins and notes, and making amounts.',
  [], [],
  ['Identifies ₹1, ₹2, ₹5, ₹10 and ₹20', 'Makes an amount up to ₹20 in two ways', 'Adds notes and coins up to ₹100'],
  ['Which coin is worth more?', 'How else could you pay ₹10?'],
  { materials: 'Real coins and notes up to ₹100', steps: ['Sort coins by value.', 'Price toys ₹1–₹20 and play shop.', 'Later: pay ₹45 with notes and coins, and count the change.'] },
  ['C-8.11 B', 'C-8.11 C', 'C-8.11 D', 'C-8.11 E'], [], 'bridge');
u('B4', 2, 'Measure with hands, cups and rods', 'We can measure with our hands, feet and cups, then with one fixed unit.',
  [], [],
  ['Estimates and checks a length with hand spans or footsteps', 'Measures with one uniform unit (a rod or pencil)'],
  ['How many hand spans long is the table? Guess first!', 'Why did a grown-up get a different answer with their bigger hand?'],
  { materials: 'Hands, feet, a cup, a pencil', steps: ['Guess, then measure the bed in footsteps.', 'Fill a bottle with cups of water and count.', 'Measure the same table with a pencil; compare with hand spans.'] },
  ['C-8.9 C', 'C-8.9 D', 'C-8.9 E'], ['C1-5', 'C2-4'], 'bridge');

u('2.9', 2, 'Reasoning with numbers to 10', 'We can explain why an answer is right.',
  ['S3E18','S3E20','S6E1','S6E2','S6E3','S6E5'], [],
  ['Explains an answer using blocks ("it is 6 because…")'],
  ['How do you know?', 'Could there be another answer?'],
  { materials: 'Blocks', steps: ['Set a riddle: "I am one more than 5 and one less than 7."', 'She builds the answer and explains.', 'She makes up a riddle for you.'] },
  ['C-8.13 C', 'C-8.12 C'], ['C2-7']);
u('B6', 2, 'Numbers in our languages', 'Number names in our home languages, and number rhymes of our own.',
  [], [],
  ['Counts to 10 in a home language', 'Makes up a short number rhyme or story'],
  ['How do your grandparents count to ten?', 'Can you make a rhyme about Three?'],
  { materials: 'None', steps: ['Count steps in your home language and in English.', 'Read numerals aloud in both languages.', 'Make up a 4-line counting rhyme together.'] },
  ['C-8.5 C', 'C-8.12 C'], ['C1-6'], 'bridge');

// ---------------- Stage 3 ----------------
u('3.1', 3, 'Equal rows: arrays to 12', 'Some numbers make neat rectangles of equal rows.',
  ['S3E19','S3E21','S3E22','S3E23'], [],
  ['Builds 6, 8 and 12 as rectangles', 'Finds a number that cannot make a rectangle'],
  ['How many rows? How many in each row?', 'Can Seven make a rectangle?'],
  { materials: '12 cubes or coins', steps: ['Make 12 into rectangles: 2 rows of 6, 3 of 4…', 'Try 7: what happens?', 'Spot arrays at home: egg trays, windows.'] },
  ['C-8.7 C', 'C-8.7 D', 'C-8.2 D'], ['C2-3']);
u('3.2', 3, 'Ten and a bit: 11 to 15', 'Eleven to fifteen are ten and some more.',
  ['S3E24','S3E25','S3E29','S3E26','S3E27','S3E28','S3E30'], [],
  ['Builds 13 as 10 and 3', 'Builds step numbers 1, 3, 6, 10, 15'],
  ['Thirteen is Ten and…?', 'Fifteen is a step squad. Can you build the steps?'],
  { materials: 'Ten-sticks (10 cubes) and single cubes', steps: ['Build 11–15 with one ten-stick and ones.', 'Say each as "ten and three".', 'Build staircases 1, 1+2, 1+2+3…'] },
  ['C-8.3 C', 'C-8.3 D', 'C-8.5 D'], ['C1-1', 'C1-2']);
u('3.3', 3, 'Place value to 15', 'In 14, the 1 means one ten and the 4 means four ones.',
  ['S4E1','S4E2','S4E3','S4E4'], [],
  ['Reads 14 as one ten and four ones', 'Adds within 15 using the ten'],
  ['What does the 1 in 14 stand for?', 'Ten and how many make 12?'],
  { materials: 'Ten-sticks; numeral cards', steps: ['Show 14 with cubes and with cards (10 and 4 overlapped).', 'Make 12, 15, 11 the same way.', 'Ten plus a number: quick-fire game.'] },
  ['C-8.5 D', 'C-8.5 E', 'C-8.6 D'], ['C1-2']);
u('3.4', 3, 'Sixteen to Twenty', 'Up to twenty — two tens.',
  ['S4E5','S4E6','S4E7','S4E8','S4E9','S4E10','S4E11','S4E12','S4E13','S4E14','S4E15'], ['NS11'],
  ['Counts forwards and back from any number to 20', 'Says 20 is two tens', 'Builds square numbers 1, 4, 9, 16'],
  ['Twenty is two…?', 'Count back from 17 to 9.', 'Sixteen is a square. How many on each side?'],
  { materials: 'Two ten-frames; cubes', steps: ['Fill two ten-frames to make 20.', 'Start counting from 13, then back from 18.', 'Build the squares 1, 4, 9, 16.'] },
  ['C-8.3 C', 'C-8.3 D', 'C-8.5 D'], ['C1-1', 'C1-2']);

u('B2', 3, 'Time and calendar', 'Days, months, and o\'clock on a clock.',
  [], ['SP3'],
  ['Names the days of the week in order', 'Reads o\'clock and half past', 'Finds today\'s date on a calendar'],
  ['What day comes after Friday?', 'What time is it when the long hand points to 12?'],
  { materials: 'A wall calendar; a clock with hands', steps: ['Cross off each day on the calendar.', 'Set the clock to meal times.', 'Talk about yesterday, today, tomorrow.'] },
  ['C-8.10 A', 'C-8.10 B', 'C-8.10 C', 'C-8.10 D', 'C-8.10 E'], ['C3-6'], 'bridge');

u('3.5', 3, 'Multiplication and division', 'Multiplying is adding equal groups; dividing is sharing or grouping.',
  ['S4E16','S4E17','S4E18','S4E19','S4E20'], ['SP4'],
  ['Shows 3 groups of 4', 'Shares 12 equally between 3', 'Groups 12 into 3s'],
  ['How many groups? How many in each?', 'Share 12 sweets with 4 friends. How many each?'],
  { materials: '12 counters; 4 plates', steps: ['Make 3 plates of 4: how many in all?', 'Share 12 onto 4 plates.', 'Make groups of 3 from 12: how many groups?'] },
  ['C-8.7 C', 'C-8.7 D', 'C-8.7 E'], ['C2-3']);
u('3.6', 3, 'Bonds to 20; bridging 10', 'Make ten first to add past ten.',
  ['S5E6','S5E7'], [],
  ['Solves 8 + 5 by making 10 first'],
  ['8 needs how many to make 10?', '8 + 5: make 10, then how many more?'],
  { materials: 'Two ten-frames; counters', steps: ['Show 8 + 5 on two ten-frames.', 'Move 2 across to fill the first frame.', 'Say: "10 and 3 is 13."'] },
  ['C-8.6 D'], ['C1-3', 'C2-2']);
u('3.7', 3, 'Odd, even; 1 and 2 times tables', 'Counting in 2s gives the even numbers.',
  ['S5E5','S5E8','S5E9','S5E10'], [],
  ['Counts in 2s to 20', 'Sorts numbers to 20 as odd or even'],
  ['Is 15 odd or even? How do you know?', 'Count shoes in pairs: 2, 4, 6…'],
  { materials: 'Pairs of shoes or socks', steps: ['Count shoes in 2s.', 'Hop along even numbers on a floor track.', 'Sort numeral cards 1–20 into odd and even.'] },
  ['C-8.3 E', 'C-8.7 D', 'C-8.7 E'], ['C2-3']);

// ---------------- Stage 4 ----------------
u('4.1', 4, 'Into the twenties: rectangles and factors', 'Bigger numbers can make many rectangles.',
  ['S4E21','S4E22','S5E11','S5E12','S5E13','S5E14','S5E15'], [],
  ['Finds all the rectangles for 24'],
  ['How many different rectangles can 24 make?', 'Which number in the twenties makes only one rectangle?'],
  { materials: '24 cubes or squared paper', steps: ['Build 24 as 1×24, 2×12, 3×8, 4×6.', 'Draw them on squared paper.', 'Try 23: what happens?'] },
  ['C-8.7 D', 'C-8.7 E', 'C-8.2 E'], ['C2-3']);
u('4.2', 4, 'Counting in tens and fives', 'Tens and fives make counting big numbers quick.',
  ['S4E23','S4E24','S4E25'], [],
  ['Counts in 10s to 100', 'Counts in 5s to 50'],
  ['How many tens in 50?', 'Count your fingers in fives.'],
  { materials: 'Bundles of 10 sticks; a 100 square', steps: ['Count bundles of 10 to 100.', 'Colour multiples of 5 on the 100 square.', 'Count family fingers in 5s.'] },
  ['C-8.3 D', 'C-8.3 E', 'C-8.5 E'], ['C1-2']);
u('4.3', 4, 'Threes, fours and fives', 'Skip counting builds the 3, 4 and 5 times tables.',
  ['S5E16','S5E17','S5E18','S5E19','S5E20','S5E21','S5E22','S5E23','S5E24','S5E25'], [],
  ['Skip-counts the 3, 4 and 5 times tables', 'Recognises a cube number built from blocks'],
  ['What is 4 lots of 3?', 'How many blocks in a 2 by 2 by 2 cube?'],
  { materials: 'Cubes; a 100 square', steps: ['Colour the 3s, 4s and 5s on a 100 square — spot the patterns.', 'Build a 2×2×2 cube and count.', 'Clap-and-count the tables.'] },
  ['C-8.7 E', 'C-8.2 E'], ['C2-3', 'C3-3']);

// ---------------- Stage 5 ----------------
u('5.1', 5, 'Up to 100 and beyond', '100 is ten tens; numbers keep going.',
  ['S4E26','S4E27','S4E28','S4E29','S4E30'], [],
  ['Counts to 100', 'Says 100 is ten tens'],
  ['How many tens make 100?', 'What comes after 99?'],
  { materials: '100 square; bundles of sticks', steps: ['Build 100 from ten bundles.', 'Count from 87 to 100 and back.', 'Find patterns down the columns of a 100 square.'] },
  ['C-8.3 E', 'C-8.5 E'], ['C1-2', 'C2-1']);
u('5.2', 5, 'Big patterns', 'Patterns in numbers help us predict.',
  ['S5E26','S5E27','S5E28','S5E29','S5E30'], [],
  ['Describes a number pattern and predicts the next term'],
  ['What comes next: 1, 3, 6, 10…?', 'What is the rule?'],
  { materials: 'Cubes; paper', steps: ['Build step squads and square numbers side by side.', 'Write the sequences and find the rule.', 'She invents a pattern for you.'] },
  ['C-8.2 E', 'C-8.13 E'], ['C3-8']);
u('5.3', 5, 'Tables 6 to 9; turning arrays', '3 × 4 is the same as 4 × 3 — turn the array.',
  Array.from({ length: 15 }, (_, i) => 'S7E' + (i + 1)), [],
  ['Shows 3 × 4 = 4 × 3 by turning an array', 'Skip-counts in 6s to 9s'],
  ['Turn the rectangle: is it the same number?', 'What is 9 × 2? Trick: 10 × 2 take away 2.'],
  { materials: 'Squared paper; cubes', steps: ['Draw a 3×4 array, cut it out, turn it.', 'Build the 6, 7, 8 and 9 tables on the 100 square.', 'Try the nines trick together.'] },
  ['C-8.7 E'], ['C3-3']);
u('5.4', 5, 'Tens and ones (revisited)', 'A two-digit number can be split into tens and ones in more than one way.',
  ['S8E26','S8E27','S8E28'], [],
  ['Partitions a two-digit number into tens and ones in two ways'],
  ['Is 34 three tens and four ones — or two tens and fourteen ones?'],
  { materials: 'Bundles of 10 sticks', steps: ['Make 34 two different ways.', 'Add 23 + 14 with bundles.', 'Write the number sentence.'] },
  ['C-8.5 E', 'C-8.6 E'], ['C2-1', 'C2-2']);
u('B5', 5, 'Hundreds and thousands', 'Ten hundreds make a thousand; three-digit numbers.',
  [], [],
  ['Reads and writes numbers to 999', 'Adds and subtracts within 99 using tens and ones'],
  ['How many hundreds in 300?', 'What is 10 more than 245?'],
  { materials: 'Bundles of 10 and 100 sticks (or paper strips)', steps: ['Build 245 from hundreds, tens and ones.', 'Read prices in a shop flyer.', 'Add two shopping amounts within 99.'] },
  [], ['C2-1', 'C2-2', 'C3-1', 'C3-2'], 'bridge');
u('5.5', 5, 'Fractions', 'A half is one of two equal parts; a quarter is one of four.',
  ['S8E23','S8E24','S8E25'], [],
  ['Finds a half and a quarter of a shape', 'Finds a half of a small set (e.g. 8 grapes)'],
  ['Are the two parts equal?', 'What is half of 8?'],
  { materials: 'Paper, a roti, grapes', steps: ['Fold paper into halves and quarters.', 'Cut a roti fairly.', 'Share 8 grapes between two.'] },
  [], ['C3-7']);

// Order of the path (bridges placed after the unit shown in the plan)
const order = ['1.1','1.2','1.3','1.4','1.5','B3','1.R','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','B1','B4','2.9','B6',
  '3.1','3.2','3.3','3.4','B2','3.5','3.6','3.7','4.1','4.2','4.3','5.1','5.2','5.3','5.4','B5','5.5'];

// Explore shelf: everything not placed anywhere
const placed = new Set(units.flatMap(x => [...x.episodes, ...x.extras]));
const explore = Object.keys(titles).filter(k => !placed.has(k) && k !== 'SP8');

const episodes = {};
for (const k of Object.keys(titles)) {
  if (k === 'SP8') continue;
  const kind = k.startsWith('NS') ? 'song' : k.startsWith('SP') ? 'special' : 'episode';
  const m = k.match(/^S(\d)E(\d+)$/);
  episodes[k] = {
    title: titles[k], kind,
    label: m ? `Series ${m[1]} · Ep ${m[2]}` : kind === 'song' ? 'Numbersong' : 'Special',
    yt: ids[k] || null,
    provisional: provisional.has(k),
  };
}

const ncf = {
  'C-8.1': 'Sorts objects into groups and sub-groups by more than one property',
  'C-8.2': 'Identifies and extends simple patterns',
  'C-8.3': 'Counts up to 99 forwards and backwards, and in groups',
  'C-8.4': 'Arranges numbers up to 99 in order',
  'C-8.5': 'Recognises and uses numerals up to 99 with place value',
  'C-8.6': 'Adds and subtracts using composition and decomposition',
  'C-8.7': 'Multiplication as repeated addition, division as equal sharing',
  'C-8.8': 'Recognises shapes and their properties; spatial relations',
  'C-8.9': 'Measures length, weight and volume',
  'C-8.10': 'Measures time: days, weeks, months, hours',
  'C-8.11': 'Simple transactions with money up to ₹100',
  'C-8.12': 'Vocabulary for quantities, shapes, space and measures',
  'C-8.13': 'Formulates and solves simple mathematical problems',
};
const nipun = {
  'BV-1': 'Counts objects and links them to numerals up to 10', 'BV-2': 'Recognises and reads numerals up to 10',
  'BV-3': 'Compares two groups (more / less / equal)', 'BV-4': 'Arranges numbers, objects, shapes or events in sequence',
  'BV-5': 'Classifies objects by observable features', 'BV-6': 'Uses comparison words for length, height and weight',
  'C1-1': 'Counts objects up to 20', 'C1-2': 'Reads and writes numbers up to 99', 'C1-3': 'Adds and subtracts within 9',
  'C1-4': 'Describes 3D shapes', 'C1-5': 'Estimates length with non-uniform units', 'C1-6': 'Creates poems and stories with numbers',
  'C2-1': 'Reads and writes numbers up to 999', 'C2-2': 'Adds and subtracts within 99', 'C2-3': 'Multiplication and division as grouping and sharing',
  'C2-4': 'Measures with uniform non-standard units', 'C2-5': 'Identifies 2D shapes', 'C2-6': 'Uses spatial vocabulary', 'C2-7': 'Number and shape riddles',
  'C3-1': 'Reads and writes numbers up to 9999', 'C3-2': 'Adds and subtracts within 999', 'C3-3': 'Times tables 2–10; division facts',
  'C3-4': 'Standard units of measure', 'C3-5': 'Relates 2D and 3D shapes', 'C3-6': 'Calendar and clock to the half hour',
  'C3-7': 'Half, quarter and three-quarters', 'C3-8': 'Rules of simple patterns',
};

const byId = Object.fromEntries(units.map(x => [x.id, x]));
const out = { version: 1, stages, order, units: order.map(id => byId[id]), episodes, explore, ncf, nipun };
// integrity checks
for (const x of out.units) for (const k of [...x.episodes, ...x.extras]) if (!episodes[k]) throw new Error('missing episode ' + k + ' in ' + x.id);
if (out.units.length !== units.length) throw new Error('order/unit mismatch');
fs.mkdirSync(__dirname + '/../data', { recursive: true });
fs.writeFileSync(__dirname + '/../data/content.json', JSON.stringify(out));
console.log('units', out.units.length, 'episodes', Object.keys(episodes).length, 'with video', Object.values(episodes).filter(e => e.yt).length, 'explore', explore.length);
