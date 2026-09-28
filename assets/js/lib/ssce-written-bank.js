(function(root,factory){
  'use strict';var bank=factory();
  if(typeof module==='object'&&module.exports)module.exports=bank;
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.ssceWrittenBank=bank;}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  var mathSource='https://www.waeconline.org.ng/e-learning/Mathematics/maths240ms.html';
  var items=[];
  function math(id,title,prompt,answer,steps,checks){items.push({id:'written-m'+id,subject:'Mathematics',collection:'Mathematics written practice',origin:'AfroTools original exercise',exam:null,year:null,paper:null,number:null,title:title,prompt:prompt,answer:answer,steps:steps,checks:checks,source:mathSource,sourceLabel:'WAEC examiner guidance',sourceUse:'Guidance only; this exercise is original.'});}
  math(1,'Number bases and standard form','(a) Convert 231 base 4 to base 10. (b) Express 0.000056 × 300000 in standard form. Show each step.','(a) 45. (b) 1.68 × 10¹.',[
    'Expand the place values: 2 × 4² + 3 × 4 + 1 = 32 + 12 + 1 = 45.',
    'Write the factors as 5.6 × 10⁻⁵ and 3 × 10⁵. Their product is 16.8 × 10⁰.',
    'Standard form requires a leading number from 1 up to, but not including, 10: 16.8 = 1.68 × 10¹.'
  ],['I used powers of 4 for the place values.','My standard-form coefficient is at least 1 and less than 10.']);
  math(2,'Two-stage percentage changes','A laptop costs ₦240,000. Its price rises by 15%, then the new price is reduced by 10%. Find the final price and the overall percentage change.','₦248,400; an overall increase of 3.5%.',[
    'After the increase: 240000 × 1.15 = 276000 naira.',
    'Apply the discount to the new price: 276000 × 0.90 = 248400 naira.',
    'The change is 8400 naira. Divide by the original 240000 and multiply by 100: 3.5%. The two percentages cannot simply be subtracted.'
  ],['The second percentage uses the updated price.','The overall percentage uses the original price.']);
  math(3,'Form and solve simultaneous equations','A school sells 180 event tickets. Student tickets cost ₦500 and adult tickets cost ₦800. Total receipts are ₦114,000. Find how many tickets of each type were sold.','100 student tickets and 80 adult tickets.',[
    'Let s be student tickets and a be adult tickets. Then s + a = 180 and 500s + 800a = 114000.',
    'Multiply the first equation by 500: 500s + 500a = 90000. Subtract it from the revenue equation: 300a = 24000.',
    'Thus a = 80 and s = 100. Check: 100 × 500 + 80 × 800 = 114000.'
  ],['I defined my variables and wrote both equations.','Both the number of tickets and total revenue check out.']);
  math(4,'Quadratic equations in a measurement problem','A rectangular garden has area 96 m². Its length is 4 m more than its width. Find its dimensions and perimeter.','Width 8 m, length 12 m; perimeter 40 m.',[
    'Let the width be w metres. The length is w + 4, so w(w + 4) = 96.',
    'Rearrange to w² + 4w − 96 = 0 = (w + 12)(w − 8). The roots are −12 and 8.',
    'Reject the negative width. Width = 8 m, length = 12 m. Perimeter = 2(8 + 12) = 40 m.'
  ],['I rejected the negative measurement with a reason.','I distinguished area units from length units.']);
  math(5,'Variation and substitution','The quantity y varies directly as x² and inversely as z. When x = 3 and z = 2, y = 18. Find the constant of variation, then y when x = 5 and z = 4.','Constant k = 4; y = 25.',[
    'Translate the relationship into y = kx²/z.',
    'Substitute the known values: 18 = 9k/2. Hence k = 4.',
    'For the new values, y = 4 × 25 / 4 = 25. Squaring x is essential.'
  ],['I wrote the relationship before substituting.','I squared x and divided by z.']);
  math(6,'Arithmetic progression','A student saves ₦1,200 in week 1 and increases the amount saved by ₦300 each week. Find the amount saved in week 10 and the total saved over the first 10 weeks.','Week 10: ₦3,900. Total: ₦25,500.',[
    'Here a = 1200, d = 300 and n = 10. The tenth term is a + 9d = 3900 naira.',
    'The sum is n(a + last term)/2 = 10(1200 + 3900)/2 = 25500 naira.',
    'The tenth-week amount is one term, not the cumulative amount. There are nine increments before week 10.'
  ],['I used nine increments to reach the tenth term.','I calculated the total separately from the final term.']);
  math(7,'Bearings and right triangles','Starting at P, a walker travels 6 km east to Q, then 8 km north to R. Find PR and the three-figure bearing of R from P, to the nearest degree. Sketch your own labelled diagram.','PR = 10 km; bearing 037°.',[
    'The east and north movements are perpendicular. PR = √(6² + 8²) = 10 km.',
    'Bearings are measured clockwise from north. If θ is the angle east of north, tan θ = 6/8.',
    'θ = arctan(0.75) ≈ 36.87°. Rounded and written with three figures, the bearing is 037°, not 053°.'
  ],['My sketch labels north and east.','My bearing starts at north and has three figures.']);
  math(8,'Circle theorems','A, B, C and D lie on a circle in that order. Angle ABC = 112°. Find angle ADC. A tangent at A makes an angle of 38° with chord AB; C lies in the alternate segment. Find angle ACB. State the theorem for each answer.','Angle ADC = 68°; angle ACB = 38°.',[
    'ABCD is a cyclic quadrilateral. Opposite angles sum to 180°, so ADC = 180° − 112° = 68°.',
    'The alternate-segment theorem equates the angle between a tangent and a chord with the angle subtended by that chord in the alternate segment.',
    'Therefore ACB = 38°. The two results use different circle theorems; label each reason.'
  ],['I stated that the quadrilateral is cyclic.','I named the alternate-segment theorem.']);
  math(9,'Mensuration with a conversion','An open cylindrical tank has internal radius 3.5 m and height 4 m. Using π = 22/7, find its capacity in litres and the area of material for its curved wall and base. Ignore material thickness.','Capacity 154,000 litres; material area 126.5 m².',[
    'Volume = πr²h = (22/7) × 3.5² × 4 = 154 m³. Since 1 m³ = 1000 litres, capacity = 154000 litres.',
    'Curved wall area = 2πrh = 2 × (22/7) × 3.5 × 4 = 88 m².',
    'One base has area πr² = 38.5 m². There is no top, so the total is 88 + 38.5 = 126.5 m².'
  ],['I included one base and no lid.','I converted cubic metres to litres after calculating volume.']);
  math(10,'Grouped statistics','The scores 1, 2, 3 and 4 occur with frequencies 2, 3, 4 and 1 respectively. Find the mean, median and mode.','Mean 2.4; median 2.5; mode 3.',[
    'Total frequency = 10. Weighted total = 1×2 + 2×3 + 3×4 + 4×1 = 24; mean = 24/10 = 2.4.',
    'In ascending order the scores are 1,1,2,2,2,3,3,3,3,4. The middle positions are 5 and 6: median = (2 + 3)/2 = 2.5.',
    'The score 3 appears four times, more than any other score. The mode is the score 3, not its frequency 4.'
  ],['I weighted each score by its frequency.','I used the two middle observations for the median.']);
  math(11,'Probability without replacement','A bag contains 4 red balls and 3 blue balls. Two balls are drawn without replacement. Find the probability that (a) both are red, (b) exactly one is red.','(a) 2/7. (b) 4/7.',[
    'For two red balls, multiply 4/7 by 3/6 to obtain 12/42 = 2/7.',
    'Exactly one red can occur as red then blue, or blue then red. Add the disjoint cases: (4/7)(3/6) + (3/7)(4/6) = 24/42 = 4/7.',
    'The remaining case, two blue balls, has probability (3/7)(2/6) = 1/7. The three probabilities sum to 1.'
  ],['The second draw uses six remaining balls.','I counted both orders for exactly one red.']);
  math(12,'Graphs and inequalities','For y = x² − 4x + 3, calculate y at x = 0, 1, 2, 3 and 4. State the roots, the turning point, and the interval where y < 0.','y values: 3, 0, −1, 0, 3. Roots 1 and 3; turning point (2, −1); 1 < x < 3.',[
    'Substitution gives the points (0,3), (1,0), (2,−1), (3,0), (4,3). Plot a smooth upward-opening curve.',
    'Factor y = (x − 1)(x − 3) to find the x-intercepts 1 and 3. Complete the square: y = (x − 2)² − 1.',
    'The vertex is (2,−1). The graph lies below the x-axis between its roots. Strict inequality excludes both endpoints.'
  ],['My graph uses labelled axes and a consistent scale.','I excluded the roots from the strict-inequality interval.']);
  items.push({id:'waec-2023-mathematics-p2-q1',subject:'Mathematics',collection:'WAEC 2023 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2023,paper:'2',number:1,title:'Journey time and algebraic ratios',prompt:'(a) Find total travel time for 112 km at 70 km/h followed by 60 km at 50 km/h. (b) Given x/y = 2 and y/z = 3, evaluate (x + y)/(y + z).',answer:'(a) 2.8 hours, or 2 hours 48 minutes. (b) 9/4.',steps:['The two times are 112/70 = 1.6 hours and 60/50 = 1.2 hours. Add them: 2.8 hours. Convert the remaining 0.8 hour to 48 minutes.','From x/y = 2, x = 2y. From y/z = 3, y = 3z, so x = 6z.','Substitution gives (x + y)/(y + z) = (6z + 3z)/(3z + z) = 9/4. The stated ratios require nonzero denominators.'],checks:['I divided each distance by its own speed.','I converted the fractional hour correctly.','I expressed both x and y using the same variable.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths240mq1.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Question brief adapted from WAEC. Open the source for the original wording. Worked solution by AfroTools.'});
  items.push({id:'waec-2023-mathematics-p2-q2',subject:'Mathematics',collection:'WAEC 2023 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2023,paper:'2',number:2,title:'Ticket sales and simultaneous equations',prompt:'Child and adult tickets cost D3 and D5. Total attendance is 400 and receipts are D1,700. (a) Find the adult-ticket count. (b) A seller sells 250 tickets, including 175 adult tickets. Find that seller’s receipts.',answer:'(a) 250 adult tickets. (b) D1,100.00.',steps:['Let c and a be child and adult tickets. Then c + a = 400 and 3c + 5a = 1700. Subtract three times the first equation from the second: 2a = 500, so a = 250.','For the named seller, 250 total tickets minus 175 adult tickets leaves 75 child tickets.','Receipts are 75 × 3 + 175 × 5 = 225 + 875 = D1100.00. Preserve the currency and express the money to two decimal places.'],checks:['I distinguished the overall attendance from the individual seller’s tickets.','My equations agree with the ticket prices.','I included the currency and two decimal places.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths240mq2.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Question brief adapted from WAEC. Open the source for the original wording. Worked solution by AfroTools.'});
  function waecMath(number,title,prompt,answer,steps,checks){items.push({id:'waec-2023-mathematics-p2-q'+number,subject:'Mathematics',collection:'WAEC 2023 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2023,paper:'2',number:number,title:title,prompt:prompt,answer:answer,steps:steps,checks:checks,source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths240mq'+number+'.html',sourceLabel:'Read the exact WAEC question and any diagram',sourceUse:'Question brief adapted from WAEC; any diagrams shown are redrawn and not to scale. Open the source for the original. Worked solution by AfroTools.'});}
  waecMath(3,'Triangle minus sector','PQR is equilateral with side 18 cm. M bisects QR. A circle centred at P touches QR at M and meets PQ and PR at A and B. Find the shaded area outside sector PAB but inside the triangle, to two decimal places. Use π = 22/7.','13.01 cm².',[
    'The equilateral triangle has side 18 cm. Its altitude PM is √(18² − 9²) = 9√3 cm; this is also the sector radius.',
    'Triangle area = 18 × 9√3 / 2 = 81√3 cm². The sector angle is 60°, so its area is (60/360) × (22/7) × 243 = 891/7 cm².',
    'Subtract the sector from the triangle: 81√3 − 891/7 = 13.0104… cm². Round only the final result to two decimal places.'
  ],['I used the altitude, not the side, as the circle radius.','I subtracted the sector area from the triangle area.','I retained precision until the final rounding.']);
  waecMath(4,'Circle angles and a bisector','P, Q, R and S lie in that order on a circle with centre K. KR bisects angle SRQ. Angle SKR = 80° and angle KSP = 41°. Draw a labelled sketch and find (a) angle RQP and (b) angle SPQ.','(a) 89°. (b) 80°.',[
    'KS and KR are radii, so triangle KSR is isosceles. Its base angles KSR and KRS are each (180° − 80°)/2 = 50°.',
    'KR bisects angle SRQ, giving angle KRQ = 50° and angle SRQ = 100°. Opposite angles in cyclic quadrilateral PQRS sum to 180°, so angle SPQ = 80°.',
    'Angle RSP = angle RSK + angle KSP = 50° + 41° = 91°. Its opposite angle RQP is 180° − 91° = 89°.'
  ],['I used equal radii to find the triangle base angles.','I used the angle bisector before finding the cyclic angles.','I paired the correct opposite angles.']);
  waecMath(5,'Two angles of elevation','A vertical building has top P and foot T. From M, 50 m from T on level ground, the elevation of P is 66°. Moving directly backwards to C reduces it to 53°. Sketch the arrangement; find PT and MC to one decimal place.','Building height 112.3 m; distance MC = 34.6 m.',[
    'Place C, M and T on one horizontal line in that order, with P vertically above T. Mark MT = 50 m, the angle at M as 66° and the angle at C as 53°.',
    'In triangle MTP, tan 66° = PT/50. Thus PT = 50 tan 66° = 112.3018… m.',
    'In triangle CTP, CT = PT/tan 53° = 84.6255… m. The distance walked is MC = CT − MT = 34.6255… m. Round each requested length to one decimal place.'
  ],['My sketch shows the second position farther from the building.','I used degree mode.','I subtracted the original distance to obtain the distance walked.']);
  waecMath(6,'Counting numbers, probability and sharing','(a) Let M be the set of counting numbers n satisfying 2n − 3 ≤ 37. List M. If one member is chosen at random, find the probabilities that it is (i) a multiple of 3 and (ii) a factor of 10. (b) Kontor and Gapson share a bonus in the ratio 3:2. If Kontor receives Le 200,000, find the total bonus and Gapson’s share.','(a) M = {1, 2, …, 20}; (i) 3/10; (ii) 1/5. (b) Total Le 333,333.33; Gapson Le 133,333.33.',[
    'Solve 2n − 3 ≤ 37 to get n ≤ 20. As n is a counting number, M contains the 20 integers from 1 through 20.',
    'There are six multiples of 3 in M: 3, 6, 9, 12, 15 and 18. Their probability is 6/20 = 3/10. The factors of 10 in M are 1, 2, 5 and 10, giving 4/20 = 1/5.',
    'Kontor’s three ratio parts equal Le 200,000, so one part is Le 200,000/3. Five parts total Le 1,000,000/3 ≈ Le 333,333.33. Gapson receives two parts, Le 400,000/3 ≈ Le 133,333.33.'
  ],['I included every counting number from 1 to 20.','I counted outcomes before simplifying each probability.','I used three parts for Kontor and two for Gapson, then rounded money at the end.']);
  waecMath(7,'Number relationships and perpendicular lines','(a) Three numbers total 81. The second is twice the first; the third exceeds the second by 6. Find all three. (b) P = (3, 5) and Q = (−5, 7). Find the line through their midpoint R perpendicular to PQ.','(a) 15, 30 and 36. (b) y = 4x + 10.',[
    'Write the numbers as a, 2a and 2a + 6. Their sum gives 5a + 6 = 81, hence a = 15. Check: 15 + 30 + 36 = 81.',
    'Average the coordinates separately: R = ((3 − 5)/2, (5 + 7)/2) = (−1, 6). The slope of PQ is (7 − 5)/(−5 − 3) = −1/4.',
    'Perpendicular nonvertical lines have slopes whose product is −1, so the required slope is 4. Through R: y − 6 = 4(x + 1), giving y = 4x + 10.'
  ],['My three numbers satisfy both relationships and the sum.','I averaged both coordinates to find the midpoint.','My line passes through R and its slope is perpendicular to PQ.']);
  waecMath(8,'Quadratic graph and turning point','For y = 2x² − x − 4, tabulate integer x from −3 to 3 and draw the graph. Use 2 cm per x-unit and 2 cm per 2 y-units. Read the roots, the increasing interval and the minimum point.','Table y-values: 17, 6, −1, −4, −3, 2, 11. Roots ≈ −1.19 and 1.69. Minimum point (0.25, −4.125); increasing for x > 0.25.',[
    'Substitute x = −3, −2, −1, 0, 1, 2, 3 into 2x² − x − 4. Plot the resulting points using the source’s different horizontal and vertical scales.',
    'For an algebraic check of the graph readings, the roots are (1 ± √33)/4. The curve crosses the horizontal axis near −1.2 and 1.7.',
    'Complete the square: y = 2(x − 1/4)² − 33/8. The minimum point is (1/4, −33/8). To its right, y increases as x increases; on the plotted domain this is 0.25 < x ≤ 3. Graph readings will be approximate.'
  ],['I used the prescribed scales and labelled both axes.','I drew a smooth curve through the plotted points.','I distinguished the minimum y-value from the coordinates of the minimum point.']);
  waecMath(9,'Frequency table and standard deviation','Tree heights (m): 3, 4, 5, 6, 7, 8. Corresponding frequencies: 4, 6, 4, 5, 6, 2. Find the median height; calculate the mean and standard deviation to one decimal place.','Median 5 m; mean 5.3 m; standard deviation 1.6 m.',[
    'The frequencies total 27 trees. The median is the 14th observation; cumulative frequencies are 4, 10, 14, 19, 25, 27, placing it at 5 m.',
    'The weighted sum of heights is 144 m, so the mean is 144/27 = 16/3 m. Keep this exact value for the variance calculation.',
    'The weighted sum of squared heights is 834 m². Population variance = 834/27 − (16/3)² = 22/9 m². Standard deviation = √22/3 = 1.563… m. Round the mean and standard deviation to one decimal place.'
  ],['I used cumulative frequency to locate the median.','I weighted heights by their frequencies.','I did not round the mean before calculating the standard deviation.']);
  waecMath(10,'Bearings between two residences','From palace P, X is 60 m away on bearing 057° and Y is on bearing 150°. X and Y are 180 m apart. Sketch and label the positions. Find (a) the bearing of X from Y and (b) the distance PY, each to three significant figures.','(a) 349°. (b) 167 m.',[
    'Draw north lines at P and Y. Bearings 057° and 150° from P place X northeast and Y southeast; the angle XPY is 150° − 57° = 93°.',
    'Let PY = d. The cosine rule gives 180² = 60² + d² − 2(60)d cos 93°. Solve the positive root of this quadratic: d = 166.5945… m, or 167 m to three significant figures.',
    'Check the direction independently with east and north coordinates: X = (60 sin 57°, 60 cos 57°), Y = (d sin 150°, d cos 150°). The displacement from Y to X is about (−32.98, 176.95) m. Its clockwise angle from north is 349.443…°, giving bearing 349° to three significant figures.'
  ],['My sketch places both bearings clockwise from north at P.','I used the positive distance solution and rounded only at the end.','I measured the final bearing from Y towards X.']);
  waecMath(11,'Regular polygons and semicircle perimeter','(a) Regular polygon P has twice as many sides as regular polygon Q. Their exterior angles differ by 45°. Find the number of sides of P. (b) A semicircle has area 32π cm². Find its full perimeter, including the diameter, in terms of π.','(a) 8 sides. (b) (8π + 16) cm.',[
    'Let Q have n sides and P have 2n. Their exterior angles are 360/n and 180/n degrees. Subtract: 180/n = 45, so n = 4 and P has 8 sides.',
    'The semicircle area is πr²/2 = 32π. Cancel π to obtain r² = 64; the positive radius is 8 cm.',
    'The curved boundary is half a circle circumference: πr = 8π cm. Add the straight diameter 2r = 16 cm. The full perimeter is (8π + 16) cm; 8π alone gives only the arc.'
  ],['I reported the side count of P, not Q.','I used the area formula for half a circle.','I included the diameter in the perimeter and used length units.']);
  waecMath(12,'Parallel lines, circle angles and rectangle area','(a) P, Q, R and S lie on a circle with centre O; P lies on the major arc QR. QR is parallel to OS. Angle QOR = 2m, angle QPR = n and angle SOR = 54°. Find m and n. Draw a labelled sketch. (b) A rectangle has length 4 cm more than its width and perimeter 40 cm. Find its area.','(a) m = 36° and n = 36°. (b) 96 cm².',[
    'As QR is parallel to OS, angle QRO equals angle SOR = 54° by alternate interior angles. OQ = OR, so angle OQR is also 54°.',
    'Triangle OQR gives angle QOR = 180° − 54° − 54° = 72°. Since angle QOR = 2m, m = 36°. The angle at P subtends the minor arc QR, so n = angle QPR = 72°/2 = 36°.',
    'For width w, length is w + 4. Perimeter 2w + 2(w + 4) = 40 gives w = 8 cm and length 12 cm. Area = 8 × 12 = 96 cm².'
  ],['My sketch puts P on the major arc QR.','I used parallel lines and equal radii before the angle-at-centre theorem.','I used both rectangle dimensions to calculate area.']);
  items.find(function(q){return q.id==='waec-2023-mathematics-p2-q12';}).sourceLabel='WAEC 2023 examiner page';
  items.find(function(q){return q.id==='waec-2023-mathematics-p2-q12';}).sourceUse='This adapted task was checked against a 2023 paper scan and the WAEC examiner listing. The geometry is stated in words. Worked solution by AfroTools.';
  waecMath(13,'Sector, triangle and line intercepts','(a) In the diagram, ON = OM = 7 cm, angle MON = 60°, and NT is perpendicular to OM. Find the shaded area to one decimal place, using π = 22/7. (b) A line has x-intercept −3/4 and y-intercept 2/7. Find its equation.','(a) 15.1 cm². (b) −8x + 21y = 6.',[
    'The shaded part is the 60° sector OMN minus right triangle OTN. Sector area = (60/360)(22/7)7² = 77/3 cm².',
    'OT = 7 cos 60° = 3.5 cm and NT = 7 sin 60° = 7√3/2 cm. Triangle area = 49√3/8 cm². Their difference is 15.0578… cm², or 15.1 cm².',
    'Use intercept form with x-intercept −3/4 and y-intercept 2/7: x/(−3/4) + y/(2/7) = 1. Multiply by 6 to obtain −8x + 21y = 6. Check both intercepts by setting the other coordinate to zero.'
  ],['I subtracted the right triangle from the 60° sector.','I used the negative x-intercept.','I verified both intercepts in my final equation.']);
  items.find(function(q){return q.id==='waec-2023-mathematics-p2-q3';}).figure='equilateral-sector';
  items.find(function(q){return q.id==='waec-2023-mathematics-p2-q13';}).figure='sector-triangle';
  items.push({id:'waec-2022-mathematics-p2-q1b',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:1,subpart:'b',title:'Ratio and a weighted sum',prompt:'Two positive values have ratio 3:4. Three times the smaller plus twice the larger equals 68. Calculate the smaller value.',answer:'12.',steps:['Represent the values as 3k and 4k, with k positive. This preserves their ratio.','The condition becomes 3(3k) + 2(4k) = 68, so 17k = 68 and k = 4.','The smaller value is 3 × 4 = 12; the larger is 16. Check both conditions: 12:16 = 3:4 and 3 × 12 + 2 × 16 = 68.'],checks:['I multiplied the first value by three and the second by two.','I reported the smaller value, not the scale factor.','Both the ratio and weighted sum check out.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq1.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Part (b) only. Question brief adapted from WAEC; worked solution by AfroTools.'});
  items.push({id:'waec-2022-mathematics-p2-q3',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:3,title:'Perimeter of a minor segment',prompt:'A circle has radius 24.5 m. A chord cuts off a minor arc with central angle 72°. Find the perimeter of the minor segment, using π = 22/7.',answer:'Approximately 59.60 m.',steps:['The segment boundary consists of the chord and the minor arc. The two radii are not part of this perimeter.','The arc length is (72/360) × 2 × (22/7) × 24.5 = 30.8 m. Bisect the central triangle: each right triangle has hypotenuse 24.5 m and central angle 36°.','The chord length is 2 × 24.5 × sin 36° ≈ 28.8015 m. Adding gives 59.6015 m, or approximately 59.60 m. Keep extra digits until the final rounding.'],checks:['I added a chord and an arc, not two radii and an arc.','I used half the central angle to calculate half the chord.','My calculator was in degree mode.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq3.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Question brief adapted from WAEC; source image inspected. Worked solution by AfroTools.'});
  items.push({id:'waec-2022-mathematics-p2-q4',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:4,title:'Central angles and a cyclic quadrilateral',prompt:'B, C, D and E lie in that order on a circle with centre A. C lies on the minor arc BD, E on the major arc BD, and AC lies inside angle BCD. Angle BCD = (2x + 40)°, the minor central angle BAD = (5x − 35)°, angle BED = (2y + 10)°, and angle ADC = 40°. Find x, y and angle ABC. Draw a labelled sketch.',answer:'x = 35; y = 30; angle ABC = 70°.',steps:['Angle BCD subtends the major arc BD. Its central angle is the reflex angle 360° − (5x − 35)°. Therefore 2(2x + 40) = 360 − (5x − 35), giving 9x = 315 and x = 35.','Angle BCD is 110°. Opposite angles of cyclic quadrilateral BCDE sum to 180°, so angle BED = 70°. Hence 2y + 10 = 70 and y = 30.','AC = AD because they are radii, so angle ACD = angle ADC = 40°. Thus angle BCA = 110° − 40° = 70°. AB = AC, so angle ABC = angle BCA = 70°.'],checks:['I paired the angle at C with the reflex central angle.','I used opposite angles of the cyclic quadrilateral.','I justified equal base angles using equal radii.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq4.html',sourceLabel:'Read the exact WAEC question and diagram',sourceUse:'Question brief adapted from WAEC; all geometric relationships transcribed from the inspected diagram. Worked solution by AfroTools.'});
  items.push({id:'waec-2022-mathematics-p2-q7',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:7,title:'Book sales and profit functions',prompt:'(a) A seller buys 180 books at ₦250 each. He sells y books at ₦300 each and the remainder at 5% below their cost price. Total profit is ₦7,125. Find y. (b) For x bags of rice, total cost is c = 24x + 103 and total sales revenue is s = 33x − x²/20, in the same currency unit. Find the profit expression and the percentage profit when x = 20.',answer:'(a) y = 150 books. (b) Profit = 9x − x²/20 − 103; percentage profit ≈ 9.78%.',steps:['Five kobo per naira is a 5% discount. Each discounted book sells for 250 × 0.95 = ₦237.50. Total cost is 180 × 250 = ₦45,000, so revenue must be ₦52,125.','Solve 300y + 237.5(180 − y) = 52125. This gives 62.5y = 9375 and y = 150. Check: 150 × 300 + 30 × 237.5 − 45000 = 7125.','Profit is sales revenue minus cost: (33x − x²/20) − (24x + 103) = 9x − x²/20 − 103.','At x = 20, cost is 583 and revenue is 640, so profit is 57. Percentage profit uses cost as its base: 100 × 57/583 ≈ 9.78%.'],checks:['I applied the discount to the cost price.','The numbers of full-price and discounted books add to 180.','I subtracted every term of the cost expression.','I divided profit by cost, not revenue.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq7.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Question brief adapted from WAEC; complete source image inspected. Worked solution by AfroTools.'});
  var writing=[
    ['Sports festival report','Report your school’s participation in a sports festival involving several schools, writing in your role as sports prefect.',
      ['Identify the occasion, place, dates and participating schools in a concise opening.','Arrange the events in a clear sequence; explain your school’s participation and results.','Conclude with an assessment and practical recommendations. Use a report heading and identify the writer.'],
      ['I wrote a report rather than a letter.','My event involves several schools, not only houses within one school.','I included concrete events and outcomes.']],
    ['Letter to a newspaper editor','Respond to newspaper coverage about poorly maintained public facilities: write a formal letter to a national newspaper editor, explaining your opinion and proposing improvements.',
      ['Plan a formal letter with the sender’s address, date, editor’s designation and address, salutation, heading and suitable closing.','Develop two or three specific maintenance problems, their effects and causes.','Make practical recommendations and finish with a clear request for public attention.'],
      ['My formal-letter layout is complete.','I explained my opinion rather than only listing facilities.','Each recommendation addresses a problem I described.']],
    ['Advice to a friend abroad','A friend living abroad is considering your school. Write a personal letter giving useful information and advice.',
      ['Use an informal letter structure and a warm, consistent voice appropriate to a friend.','Organise useful information about studies, accommodation, activities and daily routines.','Give advice about preparation and settling in, with reasons. Answer both the information and advice parts.'],
      ['My tone fits a friend.','I gave both information and advice.','I organised the details instead of listing disconnected facts.']],
    ['School magazine article','Prepare a school-magazine article explaining why school clubs and societies should become active again.',
      ['Use a relevant headline and a byline. Open with a specific reason students should care.','Develop benefits such as practical skills, teamwork and opportunities to participate, using examples.','Suggest how clubs could restart and close with a clear call to action. Avoid a letter salutation.'],
      ['I used article features rather than letter features.','I explained the benefits of revival.','My examples support the argument.']],
    ['Narrative with a clear lesson','Write a story illustrating the saying “Half a loaf is better than none.” Show through the plot why accepting something useful can be better than receiving nothing.',
      ['Plan a human character, a concrete goal and a choice between a modest gain and an uncertain larger gain.','Build events towards a turning point in which the choice has consequences.','End by showing the value of the modest gain through the outcome. Keep the narrative tense consistent.'],
      ['My story has a conflict, turning point and resolution.','The outcome illustrates the lesson.','I kept my narrative tense consistent.']]
  ];
  items.push({id:'waec-2022-mathematics-p2-q11',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:11,title:'Polygon and circle angles',prompt:'(a) A polygon has exterior angles 42°, 38°, 57°, x°, (x + y)°, (2x − 15)° and (3x − y)°. Given x = y − 7, find x and y. (b) X, Y and Z lie on a circle with centre O. Z is on the major arc XY. Angle ZXO = 34° and the minor central angle XOY = 146°. Find angle OYZ. Draw a labelled sketch.',answer:'(a) x = 34; y = 41. (b) Angle OYZ = 39°.',steps:['Exterior angles sum to 360°. Collecting terms gives 42 + 38 + 57 + x + x + y + 2x − 15 + 3x − y = 360, or 7x + 122 = 360. Thus x = 34 and y = x + 7 = 41.','OX = OZ, so triangle XOZ has two base angles of 34°. Its angle XOZ is 180° − 68° = 112°.','The central angles around O sum to 360°: angle YOZ = 360° − 146° − 112° = 102°. Since OY = OZ, angle OYZ = (180° − 102°)/2 = 39°.'],checks:['I cancelled the positive and negative y terms correctly.','My exterior angles add to 360°.','I justified the equal base angles using equal radii.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq11.html',sourceLabel:'Read the exact WAEC question and diagram',sourceUse:'Question brief adapted from the inspected WAEC source image. Diagram relationships are stated in words. Worked solution by AfroTools.'});
  items.push({id:'waec-2022-mathematics-p2-q12b',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:12,subpart:'b',title:'Cone volume at a fixed radius',prompt:'A cone of height 24 cm has volume 1,200 cm³. A second cone has the same base radius and height 84 cm. Calculate its volume.',answer:'4,200 cm³.',steps:['For a cone, V = πr²h/3. The radius is unchanged, so πr²/3 is the same for both cones.','The height scale factor is 84/24 = 3.5. At a fixed radius, volume scales by this same factor, not its cube.','The second volume is 1200 × 3.5 = 4200 cm³. Check with V/h: both cones have ratio 50 cm².'],checks:['I kept the base radius fixed.','I scaled volume in proportion to height.','I used cubic centimetres for volume.'],source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq12.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Part (b) only. Question brief adapted from the inspected WAEC source image; worked solution by AfroTools.'});
  writing.forEach(function(w,i){items.push({id:'waec-2023-english-p2-q'+(i+1),subject:'English',collection:'WAEC 2023 writing companion',origin:'WAEC source-linked writing task',exam:'WAEC',year:2023,paper:'2',number:i+1,title:w[0],prompt:w[1],answer:'There is no single model answer. Compare your response with the planning guide and checklist, then review the examiner comments.',steps:w[2],checks:w[3],source:'https://www.waeconline.org.ng/e-learning/English/Engl240mq'+(i+1)+'.html',sourceLabel:'Read the exact WAEC question and examiner comments',sourceUse:'Task brief paraphrased from WAEC. Open the source for the exact wording. Coaching is by AfroTools; self-review is not an official mark.'});});
  var writing2022=[
    ['Career letter to a friend','Write to a friend at another school about the career you hope to follow and ways that work could help your country.',
      ['Use an informal letter layout and a friendly voice suited to someone your age. Name the career and explain what the work involves.','Develop the second part separately: show how the work could benefit people or services in your country, with specific examples rather than broad promises.','Close the letter naturally. Re-read for clear paragraphs, consistent tense and complete sentences.'],
      ['My response is an informal letter to a friend at another school.','I explained both my chosen career and its possible benefit to my country.','I used specific examples and checked the letter ending.']],
    ['Essay on counterfeit medicines','Prepare an essay-competition entry about the harm caused by fake medicines in society and practical ways to address the problem.',
      ['Give the essay a title and make clear that the topic is counterfeit or falsified medicines, not illicit or hard-drug use.','Organise paragraphs around the problem, its consequences for patients and trust, and realistic responses. Explain each point rather than listing headings or unsupported figures.','End by drawing the argument together. Check that every paragraph stays on the assigned topic and uses an appropriate essay voice.'],
      ['My essay has a relevant title and stays focused on fake medicines.','I did not confuse counterfeit medicines with hard drugs.','I developed ideas in paragraphs instead of listing points.']],
    ['Anniversary letter to the principal','As a former senior prefect, write to your old school’s principal for its 60th anniversary, congratulating the school and explaining three improvements you recommend.',
      ['Set out a formal letter with sender and recipient details, date, salutation, subject and suitable close. Keep the tone respectful.','Congratulate the principal and recognise the anniversary before proposing changes. Give three distinct suggestions, explaining the need and expected benefit of each.','Use separate, connected paragraphs rather than a bare list of facilities. Remove slang and contractions when editing.'],
      ['My formal letter includes congratulations for the anniversary.','I explained exactly three distinct school improvements and why they matter.','My layout and language fit a letter to the principal.']],
    ['Welcome speech for a new principal','Speaking for the students as senior prefect, welcome a newly appointed principal and explain three areas where the school needs attention.',
      ['Plan a speech, not a letter: greet the principal and audience, state whom you represent and open with a welcome.','Develop three different school needs, giving a concrete effect on students and a constructive request for each. Keep the address courteous.','Finish with a hopeful welcome and thanks. Read it aloud to check the flow, direct address and natural speech rhythm.'],
      ['My response is a speech delivered on behalf of the students.','I welcomed the principal and developed three distinct needs.','I used audience address and a spoken conclusion rather than letter features.']],
    ['Story about the burden of leadership','Write a story that shows how a position of authority can bring worry and difficult decisions for the person who holds it.',
      ['Choose a leader, a responsibility and a decision with consequences. Let the meaning of the linked saying emerge from events rather than attaching it to an unrelated plot.','Build a beginning, rising problem and turning point. Show what the leader risks or must sacrifice, using believable actions and details.','Resolve the conflict and connect the ending to the burden of leadership. Re-read for a consistent point of view, tense and clear language.'],
      ['My story has a beginning, turning point and resolution.','The leader’s difficult responsibility drives the plot and its outcome.','The ending illustrates the linked saying rather than simply naming it.']]
  ];
  writing2022.forEach(function(w,i){items.push({id:'waec-2022-english-p2-q'+(i+1),subject:'English',collection:'WAEC 2022 writing companion',origin:'WAEC source-linked writing task',exam:'WAEC',year:2022,paper:'2',number:i+1,title:w[0],prompt:w[1],answer:'There is no single model answer. Compare your draft with the planning guide and checklist, then read WAEC’s examiner observations.',steps:w[2],checks:w[3],source:'https://www.waeconline.org.ng/e-learning/English/Engl255mq'+(i+1)+'.html',sourceLabel:'Read the exact WAEC question and examiner comments',sourceUse:'Task brief paraphrased from WAEC. Open the official question and examiner notes for the original wording. AfroTools guidance is self-review, not an official mark or complete paper.'});});
  items.push({
    id:'waec-2022-english-p2-q6',subject:'English',collection:'WAEC 2022 English reading companion',origin:'WAEC third-party-linked reading task',exam:'WAEC',year:2022,paper:'2',number:6,
    title:'Comprehension: Alani and his business',
    prompt:'Open the linked 2022 English Paper 2 transcription and read the Section B passage before answering question 6. In your own words, explain why Alani impressed his teachers, two reasons his business first prospered, why it nearly failed, the irony in blaming his staff, and what prompted him to change. Then explain the business idiom, name the clause about his secretary and its function, and give six context-fit synonyms. The passage and exact questions remain at the source.',
    answer:'Suggested responses: (a) His strong academic performance impressed his teachers. (b) His hard work and the substantial money and time he invested helped his business succeed. (c) He became arrogant, ignored advice and treated clients badly, so they left. (d) He blamed his workers although his own conduct caused the decline. (e) Five workers resigned on the same day. (f) The business was in serious difficulty and close to failing. (g)(i) A relative or adjectival clause; (ii) it describes Alani’s secretary. (h)(i) laurels: awards; (ii) sustenance: food; (iii) reputable: respected; (iv) venture: enterprise; (v) pompous: arrogant; (vi) dwindled: declined. Other context-fitting, passage-supported wording may be valid; these are teaching suggestions, not an official mark scheme.',
    steps:['Read the entire linked passage and all parts (a)–(h). For the first five parts, connect each answer to a particular event or behaviour; give two distinct reasons for the early success.','For the idiom, use the surrounding account of the firm’s decline. For the grammar task, identify the clause introduced by “who” and the noun phrase it describes.','For each of the six vocabulary words, try your replacement in its original sentence. Keep the meaning and grammatical role, then answer briefly in your own words rather than copying long lines from the passage.'],
    checks:['My answers to (a)–(e) follow the events in the linked passage, including two separate success factors.','I explained the idiom and gave both the clause name and what it describes.','I checked all six replacement words in context and kept my answers concise.'],
    source:'https://studyzone.ng/english-language-2022-waec-past-questions/',sourceLabel:'Read the linked 2022 English transcription',sourceUse:'Open the linked third-party transcription for the passage and exact questions. AfroTools does not host the passage. WAEC examiner comments confirm a 2022 Question 6 comprehension task but omit its text. These independently checked suggestions are not an official mark scheme or complete paper.'
  });
  items.push({
    id:'waec-2022-english-p2-q7',subject:'English',collection:'WAEC 2022 English reading companion',origin:'WAEC third-party-linked reading task',exam:'WAEC',year:2022,paper:'2',number:7,
    title:'Summary: causes and prevention of armed robbery',
    prompt:'Open the linked 2022 English Paper 2 transcription and read the Section C passage. Write six sentences in your own words: three distinct factors that lead some young people into armed robbery and three distinct ways to reduce it. The passage and exact question remain at the source.',
    answer:'Suggested six-sentence response: Lack of work and employable skills can push some young people towards robbery. Some are tempted by conspicuous displays of wealth. A society that prizes money over moral conduct can encourage the crime. Parents can teach children sound values and correct dishonesty early. Government can provide basic services and support for people without work. Police can patrol areas where robberies are common. Equivalent concise points supported by the passage may be valid; this is not an official mark scheme.',
    steps:['Read the whole linked passage and mark the three cause paragraphs: limited work or skills, ostentatious wealth and the decline of moral values. Do not turn examples within one paragraph into extra causes.','Find the three prevention strands in the passage: parental guidance, government provision of basic needs or social support, and law-enforcement patrols in high-risk areas. Keep each response tied to the passage.','Write one short, complete sentence for each of the six distinct points. Paraphrase the ideas, remove repetition and check that the first three sentences answer the cause part and the last three answer the prevention part.'],
    checks:['I wrote three separate cause sentences and three separate prevention sentences.','Every point is supported by the linked passage rather than my own opinion.','I paraphrased the ideas and did not repeat the same factor in different words.'],
    source:'https://itsmyschoollibrary.wordpress.com/2023/05/04/2022-waec-english-language-paper-2-letter-essay-comprehension-and-summary-solution/',sourceLabel:'Read the linked 2022 English transcription',sourceUse:'Open the linked third-party transcription for the passage and exact question. AfroTools does not host the passage. WAEC examiner comments confirm a 2022 Question 7 summary about armed robbery but omit its text. These are independently checked teaching suggestions, not an official mark scheme or complete paper.'
  });
  var waecEnglishTranscription='https://wikiquestions.org/wiki/2023_English_Language_WAEC_SSCE_(School_Candidates)_May/June';
  items.push({
    id:'waec-2023-english-p2-q6',subject:'English',collection:'WAEC 2023 English reading companions',origin:'WAEC third-party-linked reading task',exam:'WAEC',year:2023,paper:'2',number:6,
    title:'Comprehension: Mma Koku and the Pathfinder',
    prompt:'Open the linked 2023 English Language 2 transcription and read the Section B passage before attempting question 6. In your own words, address Mma Koku’s purpose, two travel difficulties, the Pathfinder’s nickname, two signs of poverty, his attitude, her hope for her son, her age range, the figure of speech, the time clause and its function, and five context-fit vocabulary replacements. The passage and full question text remain at the source.',
    answer:'Suggested responses: (a) She was taking her savings to the Pathfinder to pass to her son at university. (b) She negotiated muddy potholes and was caught in heavy rain. (c) He was the first person from the village to earn a doctoral degree. (d) Her clothes were threadbare and she had only a small amount saved over three months. (e) Compassion. (f) She hoped her son would succeed in life. (g) About 70–74 years old. (h) Personification. (i)(i) An adverbial clause of time; (ii) it modifies “shall see” by saying when the meeting would occur. (j) delicate: frail; ominous: threatening; an obligation: a duty; overcast: cloudy; pensively: thoughtfully. Other passage-supported wording may be valid; these are teaching suggestions, not an official mark scheme.',
    steps:['Read the full passage and all ten subparts at the linked source. For (a)–(f), answer from events in the story rather than copying a sentence; give two separate details where the task asks for two.','For (e), use one word for the Pathfinder’s attitude. The official examiner comments identify an early septuagenarian in (g) as 70–74 years old.','For (h)–(j), identify the literary device and the time clause, then test each replacement word inside its original sentence so meaning and grammar still fit.'],
    checks:['I used the linked passage for every content answer and supplied two details where required.','I answered both grammar parts and gave one attitude word.','Each of my five vocabulary replacements fits its sentence.'],
    source:waecEnglishTranscription,sourceLabel:'Read the linked WAEC 2023 English transcription',sourceUse:'Open the linked third-party transcription for the passage and full question text. AfroTools does not host the passage. Suggested answers are independently checked teaching guidance, not an official mark scheme.'
  });
  items.push({
    id:'waec-2023-english-p2-q7',subject:'English',collection:'WAEC 2023 English reading companions',origin:'WAEC third-party-linked reading task',exam:'WAEC',year:2023,paper:'2',number:7,
    title:'Summary: qualities parents can teach',
    prompt:'Open the linked 2023 English Language 2 transcription and read the Section C passage. Then answer question 7 in six sentences, one distinct quality per sentence, using your own words. The passage and full question text remain at the source.',
    answer:'Suggested six-sentence response: Parents should teach children self-control. They should teach children humility. They should help children become resilient. They should teach children integrity. They should instil a strong work ethic. They should teach children to obey laws and rules. Equivalent concise, passage-supported wording may be valid; this is not an official mark scheme.',
    steps:['Read the Section C passage at the linked source and underline the six qualities named or described in its body. Distinguish the qualities from examples and consequences.','Write exactly six complete sentences, one each for self-control, humility, resilience, integrity, hard work and obedience to laws or rules. Do not split a single quality into two points.','Paraphrase rather than lift sentences. The concluding advice that parents should model good behaviour supports the teaching of these qualities; it is not a seventh requested quality.'],
    checks:['I wrote exactly six complete sentences.','Each sentence states a different quality supported by the linked passage.','I removed examples, repetition and material outside the requested qualities.'],
    source:waecEnglishTranscription,sourceLabel:'Read the linked WAEC 2023 English transcription',sourceUse:'Open the linked third-party transcription for the passage and full question text. AfroTools does not host the passage. Suggested answers are independently checked teaching guidance, not an official mark scheme.'
  });
  var necoEnglishSource='https://www.myschoolbrod.com.ng/2024/12/neco-ssce-english-language-theory-2023.html';
  var necoWriting=[
    ['Letter about a future profession','Your mother asks which profession you hope to pursue after secondary school. Write a reply explaining your choice and reasons.',
      ['Use a personal-letter layout and an appropriate, respectful voice for your mother. State the profession early.','Explain several distinct reasons for the choice, such as interests, abilities and the work involved. Support each reason with a concrete detail.','Close by responding to her concern about your future. Review the letter for clear paragraphs, spelling and the Section A minimum of 450 words.'],
      ['My response is a letter addressed to my mother.','I named one profession and explained why it suits me.','I checked the 450-word minimum and the letter ending.']],
    ['Story about charity at home','Write a story whose events show the meaning of “Charity begins at home.”',
      ['Plan characters and a situation where someone has a chance to help a person close to them. Let the proverb shape the plot rather than appear only at the end.','Build a conflict, a consequential choice and a believable outcome. Show how care shown nearby affects what happens.','Keep the narrative point of view and tense consistent. Review whether the ending makes the lesson clear and the response reaches the 450-word minimum.'],
      ['My story shows the proverb through actions.','The choice has a consequence and a clear ending.','I checked the 450-word minimum and consistent tense.']],
    ['Debate on Federal Government Colleges','As chief speaker, argue for or against the claim that establishing Federal Government Colleges benefits Nigerian children.',
      ['Choose a clear side and address the chairperson, judges and audience in a debate opening. State your position before the arguments.','Develop distinct points about access, quality or opportunity, with reasons and realistic examples. Address at least one likely counterargument.','End by reaffirming your position and asking the audience to support it. Review the formal debate voice and the 450-word minimum.'],
      ['I clearly argued one side of the stated proposition.','My speech sounds like a debate, with reasons and a response to an opposing view.','I checked the conclusion and 450-word minimum.']],
    ['School magazine article on indiscipline','Write a school-magazine article about indiscipline among secondary school students and ways to curb it.',
      ['Give the article a focused headline and byline. Define the problem through concrete school examples without naming real pupils.','Explain causes or effects and link each proposed remedy to a specific problem. Consider actions students and schools can take.','Finish with a practical call to action. Review article style, paragraph flow and the 450-word minimum.'],
      ['I used a headline and byline, not a letter salutation.','I described indiscipline and matched remedies to the problems.','I checked the 450-word minimum and a clear ending.']]
  ];
  necoWriting.forEach(function(w,i){items.push({id:'neco-2023-english-p2-q'+(i+1),subject:'English',collection:'NECO 2023 English Paper II Section A companion',origin:'NECO scan-linked writing task',exam:'NECO',year:2023,paper:'II',number:i+1,title:w[0],prompt:w[1],answer:'There is no single model answer or official mark here. Compare your response with the guide and checklist, then revise it.',steps:w[2],checks:w[3],source:necoEnglishSource,sourceLabel:'Open the NECO 2023 Paper II scan',sourceUse:'Section A task brief adapted from a 2023 NECO Paper II scan linked at the source. All four writing choices are represented; the source requires one response of at least 450 words. AfroTools provides self-review guidance, not an official marking scheme. Sections B and C remain at the source.'});});
  items.push({id:'neco-2023-english-p2-q5',subject:'English',collection:'NECO 2023 English Paper II Sections B–C companions',origin:'NECO scan-linked reading task',exam:'NECO',year:2023,paper:'II',number:5,title:'Comprehension: the teacher and society',prompt:'Open the linked scan at PDF pages 5–6 and read Section B before answering its eight parts (a)–(h). Use the passage for the two attributes, two examples of public misunderstanding, the irony, the wrong values, the teacher’s response, the two expressions and the six vocabulary replacements. The passage is available at the source, not copied here.',answer:'Suggested answers: (a) The teacher develops young people’s minds and nurtures future leaders. (b) The public blames teachers for falling education standards and accuses them of imposing improper levies. (c) Society depends on teachers to prepare future leaders yet fails to support or protect them. (d) Affluence and fanaticism. (e) By giving children moral instruction and reinforcing positive values. (f) Accepts the challenge or responsibility. (g)(i) A relative (adjectival) clause; (ii) it describes the parents. (h) noble: honourable; cradle: beginning; impart: pass on; affluence: wealth; denigrated: disparaged; important: significant. Equivalent context-fitting wording may also earn credit; this is not an official mark scheme.',steps:['Read the passage on PDF page 5 and the exact subquestions on page 6 before writing. Distinguish what the passage states from your own opinion about education.','For (a)–(e), give concise answers supported by the relevant sentence. For (c), explain both sides of the irony: social dependence on teachers and the lack of support they receive.','For the phrase and grammar parts, replace each phrase in its sentence and check the meaning. “Who have neglected their duties” describes the parents; test each vocabulary substitute in the original sentence.'],checks:['My answers to (a)–(e) are supported by the source passage.','I answered both parts of the grammar question.','Each replacement word preserves the sentence meaning and grammatical role.'],source:necoEnglishSource,sourceLabel:'Open the NECO 2023 Paper II scan',sourceUse:'Open PDF pages 5–6 for the complete passage and questions. AfroTools does not host the passage. Suggested answers are independently reviewed teaching guidance, not an official mark scheme.'});
  items.push({id:'neco-2023-english-p2-q6',subject:'English',collection:'NECO 2023 English Paper II Sections B–C companions',origin:'NECO scan-linked reading task',exam:'NECO',year:2023,paper:'II',number:6,title:'Summary: electoral commission functions',prompt:'Open the linked scan at PDF pages 7–8 and read Section C. In six sentences, one function per sentence, summarise six functions of an electoral commission that the passage describes. The passage is available at the source, not copied here.',answer:'Suggested six-sentence response: An electoral commission organises and conducts elections. It divides the country into electoral constituencies. It registers political parties. It registers eligible voters. It educates voters about election procedures and their rights. It supplies the materials needed for elections. Other distinct passage-supported functions, such as training electoral officers, screening aspirants or counting votes and releasing results, may also be valid. This is not an official mark scheme.',steps:['Read PDF pages 7–8. Identify actions carried out by the commission, such as administering elections, drawing constituencies, registration, voter education and election logistics.','Choose six distinct functions. Do not repeat “conduct elections” as separate organising and running points, and do not mistake a possible disadvantage such as gerrymandering for a function.','Write one complete sentence for each function, using your own concise words. Check that every sentence describes one passage-supported commission action.'],checks:['I wrote exactly six complete sentences.','Each sentence states one different commission function.','Every function is supported by the source passage, with no disadvantages or background facts substituted.'],source:necoEnglishSource,sourceLabel:'Open the NECO 2023 Paper II scan',sourceUse:'Open PDF pages 7–8 for the complete passage and question. AfroTools does not host the passage. Suggested answers are independently reviewed teaching guidance, not an official mark scheme.'});
  var passage='The science club at Riverbank School wanted to reduce the plastic bottles left around the compound. At first, members proposed buying more bins. Before spending their small budget, they counted discarded bottles at the end of each school day for two weeks. Most appeared near the sports field, where the only drinking-water tap had stopped working. The club asked the caretaker to repair the tap and arranged a refill station beside the field. Members also invited classmates to bring reusable bottles. After a month, the number of discarded bottles near the field had fallen, although litter remained around the bus stop. The club did not declare the problem solved. Instead, it recorded the new pattern and planned a second trial there. The head teacher praised the group for testing a practical change before buying equipment. She asked them to repeat the counts during the next sports tournament, when more visitors would be on the grounds.';
  items.push({id:'written-e-comprehension',subject:'English',collection:'English written practice',origin:'AfroTools original exercise',exam:null,year:null,paper:null,number:null,title:'Comprehension: evidence and inference',passage:passage,prompt:'(a) What did the club initially propose? (b) Give the immediate reason many bottles were discarded near the sports field. (c) Explain why a second trial was planned. (d) What does the request to count bottles during the tournament suggest about the head teacher’s approach? (e) Replace “discarded” with one word that fits the passage.',answer:'(a) Buying additional bins. (b) The nearby water tap was broken. (c) Litter was still present around the bus stop. (d) She wanted to test whether the improvement would hold when more people used the grounds. (e) “Abandoned” or “dumped”.',steps:['Locate explicit facts for (a), (b) and (c); do not replace the stated cause with a guess about students’ behaviour.','For (d), connect the increased number of visitors to the request for another measurement. Explain the inference in your own words.','For vocabulary, put the replacement back into the complete sentence. Both meaning and grammar must fit.'],checks:['I supported each answer with the passage.','My inference uses evidence rather than outside assumptions.','My replacement word fits the original sentence.'],source:'https://www.waeconline.org.ng/e-learning/English/Engl240mq6.html',sourceLabel:'WAEC comprehension guidance',sourceUse:'Guidance only. The passage and questions above are original AfroTools material.'});
  items.push({id:'written-e-summary',subject:'English',collection:'English written practice',origin:'AfroTools original exercise',exam:null,year:null,paper:null,number:null,title:'Summary: select and compress',passage:passage,prompt:'In three sentences, one point per sentence, summarise three actions the club took to reduce bottle litter near the sports field.',answer:'The club arranged for the damaged tap to be repaired. It provided a refill station near the field. It encouraged students to use reusable bottles.',steps:['Choose actions aimed directly at reducing litter near the field: the repair, the refill station and reusable bottles.','Use a separate complete sentence for each point. Counting bottles helped diagnose the problem but is not one of these three direct interventions.','Leave out the school name, praise, tournament and bus-stop trial. They do not answer this particular summary task.'],checks:['I wrote exactly three complete sentences.','Each sentence contains one distinct action.','I removed background details and repetition.'],source:'https://www.waeconline.org.ng/e-learning/English/Engl240mq7.html',sourceLabel:'WAEC summary guidance',sourceUse:'Guidance only. The passage and task above are original AfroTools material.'});
  var libraryPassage='At Greenfield Secondary School, the library committee proposed closing the after-school reading room because it was nearly empty. Some members said students were no longer interested in books. Nneka, the committee secretary, wanted evidence before the decision. For two weeks, volunteers counted visitors at lunchtime and after school. They also invited students to leave anonymous notes about when they could use the room.\n\nThe lunchtime count was consistently higher. Several notes said the last school bus left soon after lessons; others said their writers collected younger siblings. The committee could not know whether those students represented everyone, but it could test a change. It moved one supervised reading session to lunch, allowed weekend book loans and posted the new hours near the canteen. Class representatives repeated the notice.\n\nAfter a month, book loans had risen, while the after-school chairs were still mostly empty. The chairperson called the trial a failure because the room looked unchanged at closing time. Nneka disagreed: the committee had tried to improve access to reading, not to fill chairs at a particular hour. However, the short forms asking borrowers whether they had finished their books came back from only a few students. The committee kept the lunch session for another month and gave borrowers more time to respond. It postponed a final decision about after-school opening hours until it could compare attendance and borrowing more reliably.';
  items.push({
    id:'written-e-library-comprehension',subject:'English',collection:'English written practice',origin:'AfroTools original exercise',exam:null,year:null,paper:null,number:null,
    title:'Comprehension: measure the right outcome',passage:libraryPassage,
    prompt:'(a) What did some committee members conclude from the nearly empty room? (b) Give two reasons students said they could not stay after lessons. (c) Why was lunchtime a sensible time to test a reading session? (d) Explain the difference between the chairperson’s and Nneka’s measures of success. (e) Which evidence about the loans was still limited? (f) Replace “postponed” with one word that fits its sentence.',
    answer:'(a) They thought students were no longer interested in books. (b) The last school bus left soon after lessons, and some students collected younger siblings. (c) The volunteers counted more visitors at lunch than after school; it was a time more students could use. (d) The chairperson judged the trial by how full the room looked after school, while Nneka judged whether students could access reading, including by borrowing books. (e) Only a few borrowers returned forms saying whether they had finished their books, so that measure was incomplete. (f) “Delayed”. Equivalent passage-supported wording may also be valid.',
    steps:['For (a)–(c), locate the stated conclusion, both reasons in the anonymous notes and the comparison of the two visitor counts. Do not assume all students had the same barrier.','For (d), contrast the after-school room count with the wider goal of access to reading. The increase in loans supports access, but it does not prove that borrowers finished their books.','For (e), identify the low response to the borrower forms. For (f), put “delayed” back into the final sentence to check its meaning and grammar.'],
    checks:['I answered (a)–(c) with details stated in the passage, including both reasons in (b).','My answer to (d) distinguishes room occupancy from access to reading without claiming that loans prove completion.','I identified the limited borrower responses and tested my replacement word in its sentence.'],
    source:'https://www.waeconline.org.ng/e-learning/English/Engl240mq6.html',sourceLabel:'WAEC comprehension guidance',sourceUse:'Guidance only. The passage and questions above are original AfroTools material.'
  });
  items.push({
    id:'written-e-library-summary',subject:'English',collection:'English written practice',origin:'AfroTools original exercise',exam:null,year:null,paper:null,number:null,
    title:'Summary: three access changes',passage:libraryPassage,
    prompt:'In three complete sentences, one action per sentence, summarise three changes the committee made to help students access reading.',
    answer:'The committee moved a supervised reading session to lunchtime. It allowed students to borrow books for weekends. It announced the new hours near the canteen and through class representatives.',
    steps:['Find the actions after the committee reviewed the counts and notes: a lunchtime session, weekend loans and a notice repeated by class representatives.','Write one complete sentence per action. Treat the canteen notice and the class representatives as one communication action, not two separate access changes.','Leave out the earlier counts, the disagreement about success and the later decision to wait; these explain the trial but were not among the three changes requested.'],
    checks:['I wrote exactly three complete sentences.','Each sentence describes a different change made by the committee.','I paraphrased the passage and excluded the investigation and later evaluation.'],
    source:'https://www.waeconline.org.ng/e-learning/English/Engl240mq7.html',sourceLabel:'WAEC summary guidance',sourceUse:'Guidance only. The passage and task above are original AfroTools material.'
  });
  items.push({
    id:'written-e-library-letter',subject:'English',collection:'English written practice',origin:'AfroTools original exercise',exam:null,year:null,paper:null,number:null,
    title:'Writing: propose a practical reading change',
    prompt:'Your school library opens only after lessons, but many students leave promptly. Write a formal letter of about 250 words to the librarian proposing two affordable ways to improve access to books. Explain how each would work and what simple evidence you would collect before deciding whether to continue. You may invent school details for this practice task.',
    answer:'There is no single model letter. A useful response addresses the librarian formally, explains the access problem, develops two workable changes and proposes a fair way to check their effect. The 250-word target is for practice, not an official WAEC or NECO requirement.',
    steps:['Use a formal letter layout: sender and recipient details, date, salutation, a clear subject and a respectful close. State the problem without pretending an invented statistic is real.','Develop two distinct, low-cost changes in separate paragraphs. For each, explain who would arrange it and how students would use it.','Suggest at least one simple measure, such as visits or loans before and after the trial, and note a limitation. Check paragraph order, sentence clarity, spelling and the practice word target.'],
    checks:['My letter has a suitable formal layout and names the access problem.','I explained two different affordable changes and how each would work.','I proposed a fair check of the trial and reviewed the practice word target.'],
    source:'https://www.waeconline.org.ng/e-learning/English/Engl240mc.html',sourceLabel:'WAEC English examiner guidance',sourceUse:'Guidance only. This letter prompt and self-review guide are original AfroTools material.'
  });
  items.push({"subject":"Mathematics","collection":"WAEC 2022 Mathematics companion","origin":"WAEC source-linked Mathematics task","exam":"WAEC","year":2022,"paper":"2","sourceLabel":"Read the exact WAEC question","sourceUse":"Parts (a) and (b) only. Adapted brief and original worked guide; draw the chart on paper.","number":8,"subpart":"a–b","title":"Budget percentages and pie-chart angles","prompt":"A monthly budget allocates 35% to food and drinks, 7.5% to fuel, 10% to rent, 15% to a building project and 17.5% to education. The remainder is saved. Find the savings percentage and draw a pie chart for all six categories.","answer":"Savings: 15%. Sector angles, in the listed order followed by savings: 126°, 27°, 36°, 54°, 63°, 54°.","steps":["The five given percentages total 85%. Savings therefore take 100% − 85% = 15%.","A full circle is 360°, so multiply each percentage by 3.6. This gives 126°, 27°, 36°, 54°, 63° and 54°.","Draw a circle and use a protractor to mark adjacent sectors with these angles. Label each category and percentage. Check that the angles add to 360°."],"checks":["My percentages total 100%.","My sector angles total 360°.","Each sector is labelled with its category."],"id":"waec-2022-mathematics-p2-q8ab","source":"https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq8.html"});
  items.push({"subject":"Mathematics","collection":"WAEC 2022 Mathematics companion","origin":"WAEC source-linked Mathematics task","exam":"WAEC","year":2022,"paper":"2","sourceLabel":"Read the exact WAEC question","sourceUse":"Question brief adapted from WAEC; worked solution by AfroTools.","number":10,"title":"Missing frequency and standard deviation","prompt":"Children aged 3, 4, 5, 6, 7, 8, 9 and 10 years have frequencies 2, 6, 5, k, 6, 9, 8 and 5 respectively. Their mean age is 7 years. Find k and the population standard deviation of their ages.","answer":"k = 4 children; standard deviation = √(196/45) ≈ 2.087 years.","steps":["The known frequencies total 41, and their age-times-frequency total is 291. The mean equation is (291 + 6k)/(41 + k) = 7.","Thus 291 + 6k = 287 + 7k, so k = 4 and the total number of children is 45.","Use mean 7: the weighted squared deviations are 32, 54, 20, 4, 0, 9, 32 and 45. Their sum is 196.","Divide by the population size 45, then take the square root: σ = √(196/45) ≈ 2.087 years. The variance has squared units; standard deviation has years."],"checks":["I used each frequency as a weight.","My completed distribution has mean 7.","I divided by 45 before taking the square root."],"id":"waec-2022-mathematics-p2-q10","source":"https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq10.html"});
  items.push({"subject":"Mathematics","collection":"WAEC 2022 Mathematics companion","origin":"WAEC source-linked Mathematics task","exam":"WAEC","year":2022,"paper":"2","sourceLabel":"Read the exact WAEC question","sourceUse":"Question brief adapted from WAEC; worked solution by AfroTools.","number":13,"title":"Closed-cylinder area and angles of elevation","prompt":"(a) A cylinder closed at both ends has diameter 7 cm and total surface area 209 cm². Find its height using π = 22/7. (b) Two points on level ground are 19 m apart on the same straight line from a tree, on the same side of its foot. The nearer and farther angles of elevation to the top are 43° and 38°. Sketch the arrangement and find the tree height to one decimal place.","answer":"(a) 6 cm. (b) 91.5 m.","steps":["The radius is 3.5 cm. Both circular ends contribute 2πr² = 77 cm², leaving 209 − 77 = 132 cm² for the curved surface.","Since 2πrh = 22h = 132, the cylinder height is 6 cm.","For the tree sketch, mark a vertical height H and nearer horizontal distance d. The farther distance is d + 19. Then tan 43° = H/d and tan 38° = H/(d + 19).","Subtract the distances: H/tan 38° − H/tan 43° = 19. Thus H = 19/(1/tan 38° − 1/tan 43°) ≈ 91.5341 m, which rounds to 91.5 m."],"checks":["I used the radius, not the diameter.","I included both circular ends.","The larger elevation angle is at the nearer point.","I used degree mode and rounded only at the end."],"id":"waec-2022-mathematics-p2-q13","source":"https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq13.html"});
  [{"id":"neco-2023-mathematics-percentage","subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","number":1,"title":"Percentage decrease","prompt":"Reduce 120 by 25%.","answer":"90.","steps":["A 25% reduction leaves 75%.","One quarter of 120 is 30.","Subtract: 120 − 30 = 90."],"checks":["I calculated the reduction from 120.","I subtracted the reduction."],"source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper."},{"subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.","id":"neco-2023-mathematics-binary-product","number":2,"title":"Multiplying binary numbers","prompt":"Find the product of 10110₂ and 11₂. Give the answer in base two.","answer":"1000010₂.","steps":["Convert to base ten as a check: 10110₂ = 22 and 11₂ = 3.","Multiply 22 × 3 = 66.","Convert 66 to binary: 64 + 2 = 2⁶ + 2¹, so the digits are 1000010₂."],"checks":["I treated both given numbers as binary.","I converted the product back to base two."]},{"subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.","id":"neco-2023-mathematics-decimal-expansion","number":3,"title":"Decimal place values","prompt":"Express 5 + 2/100 + 3/1000 + 4/100000 as one decimal number.","answer":"5.02304.","steps":["Place 2 in the hundredths position: 0.02.","Place 3 in the thousandths position and 4 in the hundred-thousandths position: 0.003 + 0.00004.","Add to 5: 5 + 0.02 + 0.003 + 0.00004 = 5.02304."],"checks":["I kept the empty tenths and ten-thousandths positions.","Each fraction uses the correct decimal place."]},{"subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.","id":"neco-2023-mathematics-radical-simplification","number":4,"title":"Simplifying a radical quotient","prompt":"Simplify 2√5/√10 to a single radical in simplest form.","answer":"√2.","steps":["Keep the quotient under one square root: 2√5/√10 = √(4 × 5/10).","Simplify inside the root: 4 × 5/10 = 2.","Therefore the result is √2, which is positive and already in simplest radical form."],"checks":["I squared the coefficient 2 when moving it inside the root.","My final radical cannot be simplified further."]},{"id":"neco-2023-mathematics-walking-time","subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","number":5,"title":"Time from walking pace","prompt":"Walking at 88 paces per minute, each 0.55 m long, how many hours are needed for 1,936 m?","answer":"2/3 hour.","steps":["Speed = 88 × 0.55 = 48.4 metres/minute.","Time = 1936/48.4 = 40 minutes.","Convert minutes to hours: 40/60 = 2/3."],"checks":["I kept speed in metres per minute.","I converted the final time to hours."],"source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper."},{"subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.","id":"neco-2023-mathematics-modular-arithmetic","number":6,"title":"Remainder modulo nine","prompt":"Find x in the congruence 3 × 8 ≡ x (mod 9), using the least non-negative remainder.","answer":"6.","steps":["Multiply: 3 × 8 = 24.","Divide 24 by 9: 24 = 2 × 9 + 6.","The remainder is 6, so x ≡ 6 (mod 9)."],"checks":["I multiplied before taking the remainder.","My remainder is between 0 and 8."]},{"subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.","id":"neco-2023-mathematics-logarithm-evaluation","number":7,"title":"Evaluating a decimal logarithm","prompt":"Given log₁₀3 = 0.4771, evaluate log₁₀8.1 to four decimal places.","answer":"0.9084.","steps":["Rewrite 8.1 as 3⁴/10.","Use log laws: log₁₀8.1 = 4 log₁₀3 − log₁₀10.","Substitute the given value: 4 × 0.4771 − 1 = 0.9084."],"checks":["I used the given log₁₀3 rather than an unrelated rounded value.","I subtracted log₁₀10 = 1."]},{"subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.","id":"neco-2023-mathematics-logarithm-laws","number":8,"title":"Expressing y with logarithm laws","prompt":"For positive p, q and y, solve 2 log y = 8 log p + 4 log q for y.","answer":"y = p⁴q².","steps":["Divide every term by 2: log y = 4 log p + 2 log q.","Use the power and product laws: log y = log(p⁴q²).","Since the log arguments are positive, y = p⁴q²."],"checks":["I divided both coefficients by 2.","I used multiplication, not addition, when combining logarithms."]},{"id":"neco-2023-mathematics-compound-interest","subject":"Mathematics","collection":"NECO 2023 Mathematics starter","origin":"NECO scan-linked revision task","exam":"NECO","year":2023,"paper":"III","number":9,"title":"Compound interest","prompt":"Calculate interest on ₦1,200 over four years at 8% annually, compounded yearly.","answer":"₦432.59.","steps":["Use amount = principal × (1 + rate)^years.","Amount = 1200 × 1.08⁴ = 1632.586752.","Subtract the principal, then round: ₦432.59."],"checks":["I compounded annually.","I separated interest from final balance."],"source":"https://www.scribd.com/document/842881920/NECO-20230001","sourceLabel":"View the NECO source scan","sourceUse":"Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper."}].forEach(function(item){items.push(item);});
  [{"id":"waec-2021-mathematics-p2-q2","number":2,"title":"Return journey with a meeting","prompt":"A traveller leaves M at 10:00 a.m., drives to N at 72 km/h, attends a two-hour meeting, then returns at 40 km/h by a bus route 2 km longer than the outward route. Arrival back at M is 1:55 p.m. Find the outward distance MN.","answer":"48 km.","steps":["Elapsed time is 3 hours 55 minutes. Remove the two-hour meeting: travel takes 115 minutes, or 23/12 hours.","Let the outward distance be d km. Add travel times: d/72 + (d + 2)/40 = 23/12. Multiplying by 360 gives 5d + 9d + 18 = 690.","Thus 14d = 672 and d = 48 km. Check: 48/72 hour is 40 minutes; 50/40 hours is 75 minutes. Their sum is 115 minutes."],"checks":["I excluded the meeting from travelling time.","I added 2 km only to the return route.","My two travel times and meeting reproduce the arrival time."],"subject":"Mathematics","collection":"WAEC 2021 Mathematics companion","origin":"WAEC source-linked Mathematics task","exam":"WAEC","year":2021,"paper":"2","source":"https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq2.html","sourceLabel":"Read the exact WAEC question","sourceUse":"Complete selected question in adapted form; independently worked solution by AfroTools. Not a complete paper."},{"id":"waec-2021-mathematics-p2-q3","number":3,"title":"Distance and a southeast bearing","prompt":"Y lies 15 km south of X. Z lies 20 km west of X (bearing 270°). Sketch the positions. Find (a) YZ to two significant figures and (b) the bearing of Y from Z to the nearest degree.","answer":"(a) 25 km. (b) 127°.","steps":["Place X at (0, 0), Y at (0, −15), and Z at (−20, 0), with east positive horizontally and north positive vertically.","From Z to Y the displacement is 20 km east and 15 km south. Pythagoras gives YZ = √(20² + 15²) = 25 km, already expressed to two significant figures.","The direction is arctan(15/20) ≈ 36.87° south of east. A clockwise bearing begins at north: 90° + 36.87° ≈ 127°."],"checks":["My sketch places Z west of X and Y south of X.","I measured the bearing from Z, clockwise from north.","I used the requested rounding for each answer."],"subject":"Mathematics","collection":"WAEC 2021 Mathematics companion","origin":"WAEC source-linked Mathematics task","exam":"WAEC","year":2021,"paper":"2","source":"https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq3.html","sourceLabel":"Read the exact WAEC question","sourceUse":"Complete selected question in adapted form; independently worked solution by AfroTools. Not a complete paper."}].forEach(function(item){items.push(item);});
  [
    {id:'neco-2023-mathematics-p3-q21',number:21,title:'Reading intersections from two graphs',
      prompt:'Open the linked page 5 graph. Where do its straight line and parabola intersect? Use the marked x-axis crossing and dashed coordinate guides.',
      answer:'(−1, 0) and (3, 7).',
      steps:['Find the left meeting point on the x-axis. It is directly above x = −1, so its y-coordinate is 0.','Find the second point where the two curves cross. The dashed vertical guide meets x = 3 and the dashed horizontal guide meets y = 7.','Write each ordered pair as (x, y): (−1, 0) and (3, 7).'],
      checks:['I chose crossings of both graphs, not a crossing of only one graph with an axis.','I read x before y in each coordinate pair.']},
    {id:'neco-2023-mathematics-p3-q22',number:22,title:'Axis of symmetry from graph roots',
      prompt:'The parabola on the linked page 5 graph crosses the x-axis at −1 and 2. Find its vertical line of symmetry.',
      answer:'x = 0.5.',
      steps:['For a parabola, the symmetry line lies halfway between its two x-intercepts.','Take the midpoint of −1 and 2: (−1 + 2)/2 = 1/2.','A vertical line has equation x = constant, so the line is x = 0.5.'],
      checks:['I used both x-intercepts of the parabola.','I wrote an equation for a vertical line, not only a number.']},
    {id:'neco-2023-mathematics-p3-q24',number:24,title:'Locating a feasible region',
      prompt:'On the linked page 6 diagram, which labelled region satisfies 0 < y < 2, y < 3 + x and x < 0?',
      answer:'Region Z.',
      steps:['The conditions 0 < y < 2 put the region above the x-axis and below the horizontal line y = 2.','The condition x < 0 keeps it left of the y-axis. The final condition puts it below the sloping line y = 3 + x.','These boundaries overlap in region Z. As a check, (−0.5, 1) satisfies all three inequalities.'],
      checks:['I applied all three inequalities, including x < 0.','My check point is below y = 3 + x and between y = 0 and y = 2.']},
    {id:'neco-2023-mathematics-p3-q25',number:25,title:'Inequality from a number line',
      prompt:'A number line has a filled dot at −1 and an arrow extending to the right. Write the inequality it represents.',
      answer:'x ≥ −1.',
      steps:['A filled dot includes its marked endpoint, −1.','An arrow to the right includes all numbers greater than −1.','Combine the endpoint and direction: x ≥ −1.'],
      checks:['I included −1 because the dot is filled.','My inequality points toward larger numbers.']},
    {id:'neco-2023-mathematics-p3-q26',number:26,title:'Solving a quadratic by factoring',
      prompt:'Solve 2x + 8 = 21x².',
      answer:'x = 2/3 or x = −4/7.',
      steps:['Move all terms to one side: 21x² − 2x − 8 = 0.','Factor: (3x − 2)(7x + 4) = 0, since the middle terms are 12x − 14x = −2x.','Set each factor to zero: 3x − 2 = 0 gives x = 2/3; 7x + 4 = 0 gives x = −4/7.'],
      checks:['My factors expand to 21x² − 2x − 8.','Both values satisfy the starting equation.']},
    {id:'neco-2023-mathematics-p3-q27',number:27,title:'Finding the line for a graph intersection',
      prompt:'A parabola y = x² + 6x − 27 and an unknown straight line are plotted together. Their intersection x-values must solve x² + 5x − 29 = 0. Find the straight-line equation.',
      answer:'y = x + 2.',
      steps:['At an intersection, both graphs have the same y-value. Subtract the target zero expression from the parabola expression.','(x² + 6x − 27) − (x² + 5x − 29) = x + 2.','Thus the straight line is y = x + 2. Equating it with the parabola reproduces x² + 5x − 29 = 0.'],
      checks:['I cancelled the x² terms when finding a linear expression.','Equating my line with the parabola gives the requested quadratic.']},
    {id:'neco-2023-mathematics-p3-q28',number:28,title:'Completing a square',
      prompt:'What constant must be added to 2y² + 7y to make it a perfect square times 2?',
      answer:'49/8.',
      steps:['Factor out 2 from the variable terms: 2(y² + (7/2)y).','Half of 7/2 is 7/4, so the square inside the bracket needs (7/4)² = 49/16.','Multiply by the outside 2: add 49/8. Check: 2y² + 7y + 49/8 = 2(y + 7/4)².'],
      checks:['I accounted for the factor 2 outside the bracket.','Expanding my completed square gives the original two terms and 49/8.']},
    {id:'neco-2023-mathematics-p3-q29',number:29,title:'Solving two linear equations',
      prompt:'Solve the simultaneous equations x + 2y = −4 and 2x + 3y = −5.',
      answer:'x = 2; y = −3.',
      steps:['Double the first equation to get 2x + 4y = −8.','Subtract 2x + 3y = −5 from it: y = −3.','Substitute into x + 2y = −4: x − 6 = −4, so x = 2. Check both original equations.'],
      checks:['I used the same operation on both sides of an equation.','My values satisfy both original equations.']},
    {id:'neco-2023-mathematics-p3-q30',number:30,title:'Factoring a difference of squares',
      prompt:'Factorise 12a² − 3(a − 3b)² completely.',
      answer:'9(a + 3b)(a − b).',
      steps:['Take out the common factor 3: 3[4a² − (a − 3b)²].','Use A² − B² = (A − B)(A + B) with A = 2a and B = a − 3b.','The factors become 3(a + 3b)(3a − 3b) = 9(a + 3b)(a − b).'],
      checks:['I took out the factor 3 first.','Expanding my final factors gives the starting expression.']},
    {id:'neco-2023-mathematics-p3-q31',number:31,title:'Evaluating a period formula',
      prompt:'For T = 2π√(l/g), calculate T when π = 22/7, l = 16 and g = 10.',
      answer:'T ≈ 7.95.',
      steps:['Substitute all values: T = 2 × (22/7) × √(16/10).','The square-root factor is √1.6 ≈ 1.264911, while 44/7 ≈ 6.285714.','Multiply without rounding early: T ≈ 7.95087, which is 7.95 to two decimal places. The source gives no unit for T.'],
      checks:['I kept 16/10 inside the square root.','I rounded only the final value.']},
    {id:'neco-2023-mathematics-p3-q32',number:32,title:'Expanding two binomials',
      prompt:'Expand and simplify (x − 2)(x + 6).',
      answer:'x² + 4x − 12.',
      steps:['Multiply x by both terms in the second bracket: x² + 6x.','Multiply −2 by both terms: −2x − 12.','Combine the x terms: x² + (6x − 2x) − 12 = x² + 4x − 12.'],
      checks:['I multiplied every term in the first bracket by every term in the second.','The constant term is negative.']},
    {id:'neco-2023-mathematics-p3-q33',number:33,title:'Simplifying a rational expression',
      prompt:'Simplify [(x² − 8x + 12) / (3(x² + x − 6))] × 9(x + 3). State any values excluded by the original denominator.',
      answer:'3(x − 6), with x ≠ 2 and x ≠ −3.',
      steps:['Factor the numerator: x² − 8x + 12 = (x − 2)(x − 6).','Factor the original denominator: 3(x² + x − 6) = 3(x + 3)(x − 2). It is zero at x = −3 or x = 2.','Cancel only for allowed x: [(x − 2)(x − 6) / (3(x + 3)(x − 2))] × 9(x + 3) = 3(x − 6). Keep the original exclusions.'],
      checks:['I factored the numerator and denominator before cancelling.','I retained both values excluded by the original denominator.']},
    {id:'neco-2023-mathematics-p3-q34',number:34,title:'Difference in longitude',
      prompt:'Places A and B both lie at latitude 47°S. Their longitudes are 54°E and 147°E respectively. Find their angular difference in longitude.',
      answer:'93°.',
      steps:['Both longitudes are east of the prime meridian, so subtract rather than add.','Calculate 147° − 54° = 93°.','The common latitude does not change the angular difference in longitude.'],
      checks:['I noticed that both longitudes are east.','I did not use latitude as a longitude.']},
    {id:'neco-2023-mathematics-p3-q35',number:35,title:'Central and inscribed angles',
      prompt:'In a circle with centre O, points P, Q and R lie on the circumference. Triangle PQR has ∠QPR = 64° and ∠QRP = 46°. Find the central angle ∠POQ that subtends the same arc PQ as ∠PRQ.',
      answer:'92°.',
      steps:['The inscribed angle ∠PRQ is the angle at R, so it is 46°. It subtends arc PQ.','The angle at the centre subtending the same arc is twice the angle at the circumference.','Therefore ∠POQ = 2 × 46° = 92°. The 70° third angle of the triangle is not the requested central angle.'],
      checks:['I matched the central and inscribed angles to the same arc PQ.','I doubled the 46° angle at R, not the triangle’s third angle.']},
    {id:'neco-2023-mathematics-p3-q36',number:36,title:'Similar right triangles',
      prompt:'Two right triangles have matching acute-angle marks, so their vertical sides correspond and their horizontal bases correspond. The larger triangle has a 420 m base and unknown vertical side L. The smaller has a 24 cm base and an 18 cm vertical side. Find L in metres.',
      answer:'315 m.',
      steps:['Write the ratio of corresponding sides: L / 420 m = 18 cm / 24 cm. The centimetres cancel on the right.','The scale factor for the vertical side is 18/24 = 3/4.','Thus L = 420 × 3/4 = 315 m.'],
      checks:['I matched vertical to vertical and base to base.','I left the final length in metres.']},
    {id:'neco-2023-mathematics-p3-q37',number:37,title:'Gradient of a quadratic curve',
      prompt:'For the curve y = 2x² + 5x − 1, find its gradient at x = 4.',
      answer:'21.',
      steps:['Differentiate term by term: dy/dx = 4x + 5.','At x = 4, substitute into the derivative: 4(4) + 5.','The gradient of the tangent there is 21.'],
      checks:['I differentiated 2x² to 4x.','I evaluated the derivative at x = 4, rather than the curve height.']},
    {id:'neco-2023-mathematics-p3-q38',number:38,title:'Sides of a regular polygon',
      prompt:'Each interior angle of a regular polygon measures 108°. How many sides does the polygon have?',
      answer:'5 sides.',
      steps:['An exterior angle and its interior angle sum to 180°, so each exterior angle is 72°.','The exterior angles of any polygon sum to 360°.','For a regular polygon, the number of equal exterior angles is 360° ÷ 72° = 5.'],
      checks:['I used the exterior angle of 72°, not 108°, in the side-count formula.','Five interior angles of 108° sum to (5 − 2) × 180° = 540°.']},
    {id:'neco-2023-mathematics-p3-q39',number:39,title:'Angle between two perpendiculars',
      prompt:'In the linked page 8 figure, triangle ABC has equal angles at A and C. E lies on AC, D lies on BC, BE is perpendicular to AC and ED is perpendicular to BC. If ∠ABE = 68°, find ∠CED.',
      answer:'68°.',
      steps:['Because BE is perpendicular to AC, the angle at A is 90° − ∠ABE = 22°.','The base angles at A and C are equal, so ∠ACB = 22°.','ED is perpendicular to BC; therefore the angle from EC (along AC) to ED is 90° − 22° = 68°.'],
      checks:['I used the equal angles at A and C.','I matched the requested angle at E to EC and ED, not to BE.']},
    {id:'neco-2023-mathematics-p3-q40',number:40,title:'Angle formed by crossing circle chords',
      prompt:'Open the linked page 8 circle diagram. A–E–D and A–B–C are secants, BD passes through centre O, ∠EAB = 34° and ∠EDB = 40°. The chords EC and BD cross inside the circle. Find the upper angle x between the rays toward E and D.',
      answer:'66°.',
      steps:['∠EDB intercepts arc EB, so arc EB = 80°. The exterior secant angle gives 34° = (arc DC − arc EB)/2; hence arc DC = 148°.','BD is a diameter. Its semicircles give arc BC = 180° − 148° = 32° and arc ED = 180° − 80° = 100°.','For chords intersecting inside a circle, x = (arc ED + arc BC)/2 = (100° + 32°)/2 = 66°.'],
      checks:['I used the exterior secant rule for the 34° angle at A.','I averaged the arcs opposite the upper crossing angle, ED and BC.']},
    {id:'neco-2023-mathematics-p3-q41',number:41,title:'Diameter and an isosceles triangle',
      prompt:'In the linked page 8 circle, AB is a diameter, D lies on AB, DB = BC and ∠ABC = 54°. Find ∠ACD.',
      answer:'27°.',
      steps:['Since D lies on AB, ∠DBC = ∠ABC = 54°. Triangle DBC has DB = BC, so its two base angles are (180° − 54°)/2 = 63°.','An angle at C subtended by diameter AB is 90°, so ∠ACB = 90°.','Subtract the part at C inside triangle DBC: ∠ACD = 90° − 63° = 27°.'],
      checks:['I used the diameter to establish a right angle at C.','I used DB = BC to find the 63° base angle at C.']},
    {id:'neco-2023-mathematics-p3-q42',number:42,title:'Exterior angle of an isosceles triangle',
      prompt:'In the linked page 9 diagram, an isosceles triangle has exterior angles labelled 2x opposite one base angle and 5x opposite its apex angle. Find 7x.',
      answer:'140°.',
      steps:['Vertically opposite angles are equal, so the interior base angle is 2x and the interior apex angle is 5x. The second base angle is also 2x because the marked sides are equal.','Use the triangle angle sum: 2x + 2x + 5x = 180°, so 9x = 180° and x = 20°.','The requested angle is 7x = 7 × 20° = 140°.'],
      checks:['I included both equal base angles.','I evaluated 7x after finding x.']},
    {id:'neco-2023-mathematics-p3-q43',number:43,title:'Tangent and chord angle',
      prompt:'In the linked page 9 circle, KTN is tangent at T and the angle at B between BA and BT is 65°. Find the angle ∠NTA between the tangent and chord TA.',
      answer:'65°.',
      steps:['The inscribed angle ∠ABT subtends chord AT.','The tangent–chord theorem says the angle between tangent TN and chord TA equals the inscribed angle in the opposite segment.','Thus ∠NTA = ∠ABT = 65°.'],
      checks:['I used the chord TA for both angles.','I did not use the supplementary tangent angle on the other side of T.']},
    {id:'neco-2023-mathematics-p3-q44',number:44,title:'Bearing and eastward displacement',
      prompt:'A plane travels 200 km from P to Q on a bearing of 045°. It then flies from Q on a bearing of 120° to R, which is directly east of P. Find PR to the nearest kilometre.',
      answer:'386 km.',
      steps:['PQ has equal north and east components: each is 200 sin 45° = 100√2 km.','A 120° bearing gives QR a southward component equal to half its length. To return to P’s latitude, QR = 200√2 km, with eastward component QR sin 120° = 100√6 km.','Add eastward components: PR = 100√2 + 100√6 = 100√2(1 + √3) ≈ 386.37 km, so 386 km to the nearest kilometre.'],
      checks:['I made R due east of P by cancelling the northward displacement.','I rounded only after adding both eastward distances.']},
    {id:'neco-2023-mathematics-p3-q45',number:45,title:'Angle of elevation and depression',
      prompt:'From a rooftop, a boy on level ground is seen at an angle of depression of 72°. What angle of elevation does the boy measure to the rooftop?',
      answer:'72°.',
      steps:['Imagine a horizontal line at the rooftop and another horizontal line through the boy; these lines are parallel.','The line of sight cuts both horizontal lines, creating equal alternate interior angles.','The boy’s angle of elevation therefore equals the 72° angle of depression.'],
      checks:['I measured each angle from a horizontal line.','I used the same line of sight in both directions.']},
    {id:'neco-2023-mathematics-p3-q46',number:46,title:'Tangent from an acute-angle cosine',
      prompt:'An acute angle θ has cos θ = 0.8. Find tan θ.',
      answer:'3/4.',
      steps:['Treat cos θ as adjacent/hypotenuse = 0.8 = 4/5.','For an acute right triangle with adjacent side 4 and hypotenuse 5, the opposite side is √(5² − 4²) = 3.','Hence tan θ = opposite/adjacent = 3/4. The acute-angle condition makes the opposite side positive.'],
      checks:['I found the opposite side from the Pythagorean theorem.','I divided opposite by adjacent, not by hypotenuse.']},
    {id:'neco-2023-mathematics-p3-q47',number:47,title:'Ladder length from vertical height',
      prompt:'A straight ladder reaches 12 m up a vertical pole and makes a 54° angle with level ground. Find the ladder length to three significant figures.',
      answer:'14.8 m.',
      steps:['The ladder is the hypotenuse of a right triangle; the 12 m vertical height is opposite the 54° ground angle.','Use sin 54° = 12/ladder length, so ladder length = 12/sin 54°.','This is approximately 14.8328 m, which rounds to 14.8 m to three significant figures.'],
      checks:['I used sine because the known side is opposite the ground angle.','I rounded only the final length to three significant figures.']},
    {id:'neco-2023-mathematics-p3-q49',number:49,title:'Mean absolute deviation of five scores',
      prompt:'Calculate the mean deviation from the mean for the scores 4, 5, 3, 2 and 1.',
      answer:'1.2.',
      steps:['The mean score is (4 + 5 + 3 + 2 + 1)/5 = 3.','The absolute deviations from 3 are 1, 2, 0, 1 and 2; their sum is 6.','Divide by the five scores: mean deviation = 6/5 = 1.2.'],
      checks:['I used absolute deviations, so none cancel.','I divided the total deviation by all five scores.']},
    {id:'neco-2023-mathematics-p3-q50',number:50,title:'Probability of selecting a prime',
      prompt:'One integer is chosen uniformly from 1 through 30. What is the probability that it is prime?',
      answer:'1/3.',
      steps:['The prime numbers in this range are 2, 3, 5, 7, 11, 13, 17, 19, 23 and 29. One is not prime.','There are 10 favourable integers among 30 equally likely choices.','The probability is 10/30 = 1/3.'],
      checks:['I excluded 1 from the prime list.','I used all 30 integers as the denominator.']},
    {id:'neco-2023-mathematics-p3-q51',number:51,title:'Two colours without replacement',
      prompt:'A bag holds 4 red and 6 blue balls. Draw two without replacement. Find the chance that their colours differ.',
      answer:'8/15.',
      steps:['Red then blue has probability (4/10)(6/9) = 4/15.','Blue then red has probability (6/10)(4/9) = 4/15.','Add the two disjoint orders: 4/15 + 4/15 = 8/15. The second denominator is 9 because the first ball is not replaced.'],
      checks:['I included both possible colour orders.','I used nine balls for the second draw.']},
    {id:'neco-2023-mathematics-p3-q52',number:52,title:'Missing pie-chart sector',
      prompt:'The linked chart assigns 70° to Literature, 20° to Physics and 150° to English. How many degrees remain for Economics?',
      answer:'120°.',
      steps:['All sectors in the pie chart total 360°.','The three labelled sectors use 70° + 20° + 150° = 240°.','Economics takes the remaining 360° − 240° = 120°.'],
      checks:['I included the 20° Physics sector.','My four sectors total 360°.']},
    {id:'neco-2023-mathematics-p3-q53',number:53,title:'Pie-chart share as a percentage',
      prompt:'The English sector in the linked chart on page 10 measures 150°. What percentage of the whole does it represent, to the nearest whole percent?',
      answer:'42%.',
      steps:['A full circle measures 360°, so the English share is 150/360.','Convert to a percentage: (150/360) × 100 = 41.666…%.','Round to the nearest whole percent to obtain 42%.'],
      checks:['I divided by all 360°, not another sector.','I rounded after converting to a percentage.']},
    {id:'neco-2023-mathematics-p3-q54',number:54,title:'Mean from a frequency table',
      prompt:'Marks 2, 5, 7, 8, 9 and 10 have frequencies 9, 4, 3, 7, 8 and 2 respectively. Find the mean mark to one decimal place.',
      answer:'6.3.',
      steps:['The frequencies sum to 9 + 4 + 3 + 7 + 8 + 2 = 33.','The weighted marks total 2(9) + 5(4) + 7(3) + 8(7) + 9(8) + 10(2) = 207.','Divide 207 by 33 to get about 6.2727; this is 6.3 to one decimal place.'],
      checks:['I multiplied each mark by its frequency.','I divided by 33 students, not six mark categories.']},
    {id:'neco-2023-mathematics-p3-q55',number:55,title:'Probability from an interview score table',
      prompt:'Scores 6, 7, 8, 9 and 10 occurred 2, 4, 2, 5 and 3 times. If one applicant is chosen uniformly, find the chance that the score is at most 8.',
      answer:'1/2.',
      steps:['Scores no greater than 8 occur 2 + 4 + 2 = 8 times.','The total number of applicants is 2 + 4 + 2 + 5 + 3 = 16.','The probability is 8/16 = 1/2; a score of exactly 8 qualifies.'],
      checks:['I counted scores of exactly 8.','I used all 16 applicants as the denominator.']},
    {id:'neco-2023-mathematics-p3-q56',number:56,title:'Two fruit draws with replacement',
      prompt:'Of 20 oranges, 14 are ripe and 6 unripe. Draw two with replacement. Find the chance of getting one ripe and one unripe, in either order.',
      answer:'21/50.',
      steps:['With replacement, each draw has probabilities 14/20 for ripe and 6/20 for unripe.','Either ripe then unripe or unripe then ripe qualifies, and both orders have the same probability.','Add them: 2(14/20)(6/20) = 168/400 = 21/50.'],
      checks:['I counted both orders.','I kept 20 oranges as the denominator on each draw.']},
    {id:'neco-2023-mathematics-p3-q57',number:57,title:'Missing value from an average',
      prompt:'The mean of 2, 5, x and 6 is 4. What is x?',
      answer:'3.',
      steps:['Four values with a mean of 4 must total 4 × 4 = 16.','The known three values add to 2 + 5 + 6 = 13.','Subtract: x = 16 − 13 = 3. Substitution gives a total of 16.'],
      checks:['I multiplied the mean by four values.','I checked that the resulting total is 16.']},
    {id:'neco-2023-mathematics-p3-q58',number:58,title:'Definite integral of a polynomial',
      prompt:'Evaluate the integral of 2x − x² between x = 0 and x = 2.',
      answer:'4/3 (1⅓).',
      steps:['An antiderivative of 2x − x² is x² − x³/3.','At x = 2 this equals 4 − 8/3 = 4/3; at x = 0 it equals zero.','Subtract the lower value from the upper value to obtain 4/3, or 1⅓.'],
      checks:['I integrated x² as x³/3.','I evaluated both bounds before subtracting.']},
    {id:'neco-2023-mathematics-p3-q59',number:59,title:'Stationary point of a quadratic',
      prompt:'For y = 3x² − 4x − 12, find the x-value where dy/dx is zero.',
      answer:'2/3.',
      steps:['Differentiate to obtain dy/dx = 6x − 4.','At a stationary point, 6x − 4 = 0.','Thus 6x = 4 and x = 2/3.'],
      checks:['I differentiated the constant to zero.','I set the derivative, not y, equal to zero.']},
    {id:'neco-2023-mathematics-p3-q60',number:60,title:'Distance from a velocity function',
      prompt:'A particle has velocity v(t) = 3t + 4 m/s for the first four seconds. How far does it travel in that interval?',
      answer:'40 m.',
      steps:['Velocity is positive throughout 0 ≤ t ≤ 4, so distance is the integral of velocity on that interval.','An antiderivative of 3t + 4 is (3/2)t² + 4t.','Evaluate at four and zero: (3/2)(4²) + 4(4) = 24 + 16 = 40 m.'],
      checks:['I integrated velocity over the four-second interval.','I checked that velocity stays positive, making distance equal displacement.']}
  ].forEach(function(q){items.push(Object.assign({subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'},q));});
  items.push({
    id:'waec-2022-mathematics-p2-q6',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:6,
    title:'Quadratic graph and straight-line gradient',
    prompt:'The graph below shows a quadratic curve y = mx² + nx + r and a straight line through P and Q. (a) Use the numbered axes and the paper-scale note to state the scale on each axis. (b) Find m, n and r from the curve. (c) Find the gradient of line PQ. (d) State the x-values for which the quadratic curve is above the x-axis.',
    answer:'(a) x-axis: 2 cm to 2 units; y-axis: 2 cm to 10 units. (b) m = −1, n = 2, r = 8. (c) Gradient 4. (d) −2 < x < 4.',
    steps:['Each bold grid step corresponds to 2 cm on the source paper: 2 x-units horizontally and 10 y-units vertically. The curve crosses the x-axis at −2 and 4 and the y-axis at 8. P and Q are (−5, −27) and (3, 5).','Write y = a(x + 2)(x − 4). At x = 0, y = 8, so −8a = 8 and a = −1. Expanding gives y = −x² + 2x + 8: m = −1, n = 2 and r = 8.','The straight-line gradient from P to Q is (5 − (−27))/(3 − (−5)) = 32/8 = 4.','The parabola opens downward and crosses the x-axis at −2 and 4. It is strictly positive only between those intercepts.'],
    checks:['I used the numbered axes and the paper-scale note for both scales.','I used the quadratic curve, not the straight line, for m, n and r.','My gradient uses the same point order in numerator and denominator.','I excluded both roots because y is zero there.'],
    figure:'quadratic-gradient',figureCaption:'Original redraw. Each bold grid step represents 2 cm on the source paper. The diagram resizes on screen; do not measure screen centimetres.',
    figureAlt:'Coordinate graph with a solid downward-opening curve and a dashed line through P and Q. Horizontal ticks go from −8 to 8 in steps of 2; vertical ticks go from −70 to 10 in steps of 10. Bold grid steps are square. Graph data for readers who cannot see it: curve points (−2, 0), (0, 8), (4, 0); P(−5, −27) and Q(3, 5).',
    source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq6.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Source-linked graph task with an original in-page redraw and independent worked guide. The source link provides the exact WAEC question. Not a complete paper.'
  });
  items.push({
    id:'waec-2022-mathematics-p2-q9',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:9,
    title:'Trigonometric table and graph',
    prompt:'For 0° ≤ x ≤ 180°, calculate y = 3 sin x + 7 cos x at every 20° step, to one decimal place. Plot a smooth graph using 2 cm for 20° horizontally and 2 cm for 2 y-units vertically. From your graph estimate (i) y when x = 150° and (ii) the interval in which y > 0.',
    answer:'At x = 0°, 20°, 40°, 60°, 80°, 100°, 120°, 140°, 160° and 180°, y ≈ 7.0, 7.6, 7.3, 6.1, 4.2, 1.7, −0.9, −3.4, −5.6 and −7.0. (i) y(150°) ≈ −4.6. (ii) 0° ≤ x < about 113°.',
    steps:['Use degree mode. For example, y(80°) = 3 sin 80° + 7 cos 80° ≈ 4.2; evaluate the other nine 20° steps the same way, retaining a decimal place.','Mark 0°–180° horizontally at the requested scale and y-values from −8 to 8 vertically. Plot the ten coordinates and join them smoothly; do not connect them as separate straight-line segments.','At 150°, 3 sin 150° + 7 cos 150° ≈ −4.562, so the graph should read about −4.6.','The curve crosses zero near 113°. As a calculation check, tan x = −7/3 in the second quadrant gives x = 180° − arctan(7/3) ≈ 113.2°. Since y(0°) = 7 > 0, the positive interval begins at 0° and ends before that crossing.'],
    checks:['My calculator used degrees.','My table has all ten 20° positions and the graph uses both stated scales.','I used the graph for the estimates and checked the signs on either side of the zero crossing.'],
    source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq9.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Complete selected graph task in adapted form. Draw your own graph; AfroTools does not reproduce WAEC images or provide automatic graph marking.'
  });
  items.push({
    id:'waec-2022-mathematics-p2-q12a',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:12,subpart:'a',
    title:'Winning exactly two of three races',
    prompt:'In each of three independent races, an athlete has a 1/4 chance of not winning and a 3/4 chance of winning. Find the probability that the athlete wins (i) only the second race, (ii) all three races, and (iii) exactly two races.',
    answer:'(i) 3/64. (ii) 27/64. (iii) 27/64.',
    steps:['The three race outcomes are independent. For each race, P(loss) = 1/4 and P(win) = 1 − 1/4 = 3/4.','Only the second win is loss–win–loss: (1/4)(3/4)(1/4) = 3/64. All three wins give (3/4)³ = 27/64.','Exactly two wins can occur as win–win–loss, win–loss–win or loss–win–win. Each has probability (3/4)²(1/4) = 9/64, so the three disjoint patterns total 27/64.'],
    checks:['I treated only the second win as one specific order.','I counted all three positions for the single non-win in exactly two wins.','I multiplied probabilities because the races are independent.'],
    source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq12.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Part (a) adapted as an independent-races probability model. Original worked guidance by AfroTools; part (b) is a separate companion.'
  });
  items.push({
    id:'waec-2022-mathematics-p2-q8c',subject:'Mathematics',collection:'WAEC 2022 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2022,paper:'2',number:8,subpart:'c',
    title:'Monthly tax and savings after tax',
    prompt:'A worker earns $28,800 gross in a year and pays 12% income tax. The budget from part (a) saves 15% of take-home pay. Calculate the monthly tax and the amount saved each month.',
    answer:'Monthly tax: $288. Monthly savings: $316.80.',
    steps:['Annual tax is 12% of $28,800: 0.12 × 28,800 = $3,456. Divide by 12 for monthly tax of $288.','Subtract annual tax before applying the savings rate: annual take-home pay is $28,800 − $3,456 = $25,344, or $2,112 per month.','Savings are 15% of monthly take-home pay: 0.15 × $2,112 = $316.80. Check that 12 × $316.80 = 15% of $25,344.'],
    checks:['I calculated tax from gross pay.','I applied the 15% savings rate to take-home pay.','I reported both monthly amounts in money units.'],
    source:'https://www.waeconline.org.ng/e-learning/Mathematics/maths235mq8.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Part (c) adapted from the linked WAEC question and worked image; independently checked explanation by AfroTools. Part (a) supplies the savings rate.'
  });
  const necoMathCompanions = [
    {
      id:'neco-2023-mathematics-set-operations',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:10,
      title:'Intersection of two unions',
      prompt:'Let A = {a, 1, c, 4, d}, B = {b, 4, 0, 9, 7, 6}, and C = {a, 4, 8, 9, d, 2, 5}. Find (A ∪ B) ∩ (A ∪ C).',
      answer:'{a, 1, c, 4, d, 9}.',
      steps:['Use the distributive law: (A ∪ B) ∩ (A ∪ C) = A ∪ (B ∩ C).','The only elements shared by B and C are 4 and 9, so B ∩ C = {4, 9}.','Add those shared elements to A without repeating 4: the result is {a, 1, c, 4, d, 9}.'],
      checks:['I included every element of A.','I added only elements found in both B and C.','I listed each element once.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-percentage-error',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:11,
      title:'Percentage error in a measurement',
      prompt:'A measurement was recorded as 21.23 cm³, while its true value is 21.32 cm³. Calculate the percentage error to one decimal place.',
      answer:'0.4%.',
      steps:['Find the absolute error: |21.23 − 21.32| = 0.09 cm³.','Divide by the true value, then multiply by 100: (0.09 ÷ 21.32) × 100 ≈ 0.4221%.','Round the percentage to one decimal place: 0.4%.'],
      checks:['I used the true value as the denominator.','I took the absolute difference, so the error is positive.','I rounded the final percentage to one decimal place.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-arithmetic-progression',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:12,
      title:'Seventeenth term of an arithmetic progression',
      prompt:'An arithmetic progression starts with 3. Its third and twelfth terms add to 38½. Find its seventeenth term.',
      answer:'43.',
      steps:['For common difference d, the third term is 3 + 2d and the twelfth is 3 + 11d.','Their sum is 6 + 13d = 38½, so 13d = 32½ and d = 2½.','The seventeenth term is 3 + 16d = 3 + 16 × 2½ = 43.'],
      checks:['I used term n = first term + (n − 1)d.','My third and twelfth terms add to 38½.','I used 16 common differences to reach term 17.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-venn-students',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:13,
      title:'Students taking at least two subjects',
      prompt:'A school survey has 6 students taking only Biology, 3 only Physics and 6 only Mathematics. Exactly two subjects were taken by 5 in Biology and Physics, 7 in Biology and Mathematics, and 1 in Physics and Mathematics. Another 4 took all three, while 4 took none of them. How many took at least two subjects, and how many students are in the school?',
      answer:'17 took at least two subjects; 36 students in the school.',
      steps:['The three exactly-two regions contain 5 + 7 + 1 = 13 students. Include the 4 taking all three: 13 + 4 = 17.','The seven disjoint subject regions contain 6 + 3 + 6 + 5 + 7 + 1 + 4 = 32 students.','Include the 4 outside all three subject groups: 32 + 4 = 36 students in the school.'],
      checks:['I included the three-subject group when counting at least two.','I counted each disjoint region only once.','I included students outside all three circles in the school total.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-geometric-progression',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:14,
      title:'First term of a geometric progression',
      prompt:'The third term of a geometric progression is 18 and the sixth is 486. Find its first term.',
      answer:'2.',
      steps:['With first term a and common ratio r, the third and sixth terms are ar² = 18 and ar⁵ = 486.','Divide the equations: r³ = 486/18 = 27, so r = 3.','Substitute into ar² = 18: 9a = 18, hence a = 2.'],
      checks:['I used powers 2 and 5 for the third and sixth terms.','I divided the equations to eliminate a.','My first term and ratio reproduce both given terms.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-rectangle-perimeter',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:15,
      title:'Perimeter from a rectangle’s area',
      prompt:'A rectangular piece of cardboard has area 104 cm² and width 8 cm. Find its perimeter.',
      answer:'42 cm.',
      steps:['Area = length × width, so the length is 104 ÷ 8 = 13 cm.','Add the two side lengths: 13 + 8 = 21 cm.','The perimeter is twice that sum: 2 × 21 = 42 cm.'],
      checks:['I divided area by width to find the length.','I counted both lengths and both widths.','My final unit is centimetres, not square centimetres.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-matrix-determinant',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:16,
      title:'Determinant of a three-by-three matrix',
      prompt:'Find the determinant of the 3 × 3 matrix whose rows, from top to bottom, are (2, 3, 1), (1, 0, 2) and (0, 2, 3).',
      answer:'−15.',
      steps:['Expand along the first row, alternating signs: 2(0 × 3 − 2 × 2) − 3(1 × 3 − 2 × 0) + 1(1 × 2 − 0 × 0).','The three terms are −8, −9 and +2.','Add them: −8 − 9 + 2 = −15.'],
      checks:['I kept the middle cofactor negative.','Each 2 × 2 minor uses the correct remaining rows and columns.','I added all three signed terms.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-helicopter-time',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:17,
      title:'Journey time at one-quarter speed',
      prompt:'A helicopter flies from Kano to Lagos in 3 hours at a constant speed. A second helicopter takes the same route at one-quarter of that speed. How long does the second journey take?',
      answer:'12 hours.',
      steps:['For the same distance, travel time is inversely proportional to speed.','The second speed is one-quarter as large, so its time is four times as long.','Multiply: 3 × 4 = 12 hours.'],
      checks:['I compared times over the same distance.','I increased, rather than reduced, the time at the lower speed.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-fraction-equations',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:18,
      title:'Recovering a fraction from two changes',
      prompt:'Adding 1 to the denominator of a fraction makes it 1/2. Adding 3 to both its numerator and denominator instead makes it 3/4. Find the original fraction.',
      answer:'3/5.',
      steps:['Let the fraction be n/d. From n/(d + 1) = 1/2, obtain d = 2n − 1.','The other condition gives (n + 3)/(d + 3) = 3/4, so 4n + 12 = 3d + 9. Substituting d = 2n − 1 gives n = 3 and d = 5.','Check both changes: 3/(5 + 1) = 1/2 and (3 + 3)/(5 + 3) = 6/8 = 3/4.'],
      checks:['I changed only the denominator in the first condition.','I changed both numerator and denominator in the second.','My fraction satisfies both conditions.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-partial-variation',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:19,
      title:'Constant part and direct variation',
      prompt:'A quantity y has a constant part and a part directly proportional to x. When x = 3, y = 2; when x = 6, y = 5. Find the relationship between x and y.',
      answer:'y = x − 1.',
      steps:['Write y = a + bx, where a is constant and bx varies directly with x.','The change in y divided by the change in x gives b = (5 − 2)/(6 − 3) = 1.','Use x = 3 and y = 2: 2 = a + 3, so a = −1 and y = x − 1.'],
      checks:['I included a constant term in the model.','I checked that x = 6 gives y = 5.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    },
    {
      id:'neco-2023-mathematics-quadratic-roots',subject:'Mathematics',collection:'NECO 2023 Mathematics starter',origin:'NECO scan-linked revision task',exam:'NECO',year:2023,paper:'III',number:20,
      title:'Quadratic equation from its roots',
      prompt:'Find a quadratic equation with roots 2 and −1/3.',
      answer:'3x² − 5x − 2 = 0.',
      steps:['A polynomial with these roots has factors (x − 2)(x + 1/3).','Clear the fraction by multiplying the equation by 3: (x − 2)(3x + 1) = 0.','Expand: 3x² + x − 6x − 2 = 3x² − 5x − 2 = 0.'],
      checks:['Each stated root makes one factor zero.','I multiplied the whole equation when clearing the fraction.','My expanded coefficients have the correct signs.'],
      source:'https://www.scribd.com/document/842881920/NECO-20230001',sourceLabel:'View the NECO source scan',sourceUse:'Adapted brief; independently worked solution by AfroTools. Selected tasks, not a complete paper.'
    }
  ];
  const necoMathPosition = items.findIndex(function(item){return item.id === 'neco-2023-mathematics-compound-interest';});
  if (necoMathPosition < 0) throw new Error('NECO Mathematics insertion point missing');
  items.splice(necoMathPosition + 1, 0, ...necoMathCompanions);
  [
    {id:'waec-2021-mathematics-p2-q1a',number:1,subpart:'a',title:'Simple interest and equal repayments',
      prompt:'A loan of 25,000 monetary units carries 21% simple interest per year for a fixed three-year term. The full three-year amount is repaid in two equal annual instalments. Find the amount of each instalment.',
      answer:'20,375 monetary units per year.',
      steps:['Compute the interest for the agreed term: 25,000 × 0.21 × 3 = 15,750 monetary units.',
        'Add the interest to the principal: 25,000 + 15,750 = 40,750 monetary units due.',
        'Split that total into two equal payments: 40,750 ÷ 2 = 20,375 monetary units per year. Check that two payments recover the full 40,750.'],
      checks:['I used the stated three-year interest term.','I included principal and interest before dividing by two.']},
    {id:'waec-2021-mathematics-p2-q1b',number:1,subpart:'b',title:'Consecutive numbers and a percentage',
      prompt:'Two consecutive positive integers satisfy this condition: three times the smaller plus twice the larger is 17. Find the smaller as a percentage of their sum, to three significant figures.',
      answer:'42.9%.',
      steps:['Call the smaller number n; the larger is n + 1. Then 3n + 2(n + 1) = 17.',
        'Simplify to 5n + 2 = 17, so n = 3 and the consecutive numbers are 3 and 4.',
        'The smaller contributes 3/(3 + 4) × 100 = 42.857…%. To three significant figures this is 42.9%.'],
      checks:['I used consecutive integers, not two unrelated numbers.','I divided by the sum of both numbers.','I rounded the percentage to three significant figures.']},
    {id:'waec-2021-mathematics-p2-q5a',number:5,subpart:'a',title:'Turn five percentage shares into pie sectors',
      prompt:'Five shares make up a whole: 5%, 15%, 10%, 45% and 25%. Find each angle in a pie chart, in that order, then sketch and label the sectors.',
      answer:'18°, 54°, 36°, 162° and 90°, respectively.',
      steps:['A full pie chart is 360°, so multiply each percentage by 360°/100 = 3.6°.',
        'The sectors are 5 × 3.6° = 18°, 15 × 3.6° = 54°, 10 × 3.6° = 36°, 45 × 3.6° = 162° and 25 × 3.6° = 90°.',
        'Check that 18° + 54° + 36° + 162° + 90° = 360°. Draw the sectors in order and label each percentage.'],
      checks:['I converted every percentage into an angle.','My five angles add to 360°.','My sketch labels the five sectors.']},
    {id:'waec-2021-mathematics-p2-q5b',number:5,subpart:'b',title:'Two red beads without replacement',
      prompt:'A box holds 12 beads, five of them red. Two beads are taken one after the other without putting the first back. Find the probability that both are red.',
      answer:'5/33 (about 0.1515).',
      steps:['The first draw is red with probability 5/12.',
        'After a red bead is taken, four red beads remain among 11, so the conditional probability for the second draw is 4/11.',
        'Multiply: (5/12) × (4/11) = 20/132 = 5/33, about 0.1515.'],
      checks:['I reduced both the total and red-bead count after the first red draw.','I multiplied the two dependent probabilities.','I simplified the final fraction.']},
    {id:'waec-2021-mathematics-p2-q6a',number:6,subpart:'a',title:'Biology and Physics overlap',
      prompt:'Of 80 learners, three quarters study Biology and three fifths study Physics; everyone studies at least one. Draw a two-circle Venn diagram. Find the number who study both and the fraction of the full class who study Biology only.',
      answer:'Both subjects: 28 learners; Biology only: 2/5 of the class.',
      steps:['Biology has (3/4) × 80 = 60 learners and Physics has (3/5) × 80 = 48. The union is all 80 learners.',
        'Use the overlap rule: both = 60 + 48 − 80 = 28. Put 28 in the intersection, 32 in Biology only and 20 in Physics only.',
        'The requested fraction is Biology only divided by the full class: 32/80 = 2/5. Check 32 + 28 + 20 = 80.'],
      checks:['I used the whole class as the union.','My Venn regions add to 80.','I divided Biology-only learners by 80, not by the Biology total.']},
    {id:'waec-2021-mathematics-p2-q6b',number:6,subpart:'b',title:'Separate carpet and paint costs',
      prompt:'An office floor is 15 m by 8 m. Carpet costs GH¢890 per square metre, and a total of GH¢216,120 is spent on carpet and painting. How much of that total is for painting?',
      answer:'GH¢109,320.',
      steps:['Floor area = 15 × 8 = 120 m².',
        'Carpet cost = 120 × GH¢890 = GH¢106,800.',
        'Painting is the remaining spend: GH¢216,120 − GH¢106,800 = GH¢109,320. The two costs add back to GH¢216,120.'],
      checks:['I calculated area in square metres before using the unit price.','I subtracted carpet cost from the combined total.','My two costs sum to the stated total.']},
    {id:'waec-2021-mathematics-p2-q11',number:11,title:'Study hours: mean and standard deviation',
      prompt:'For daily study hours 4, 5, 6, 7, 8, 9, 10 and 11, the respective frequencies among 50 students are 5, 7, 5, 9, 12, 4, 3 and 5. Calculate the mean and population standard deviation, each to two decimal places.',
      answer:'Mean = 7.30 hours; standard deviation = 2.04 hours.',
      steps:['Check the frequencies total 50. Multiplying each hour value by its frequency and adding gives Σfx = 365, so mean = 365/50 = 7.30 hours.',
        'Square each hour value before multiplying by its frequency. The total is Σfx² = 2,873.',
        'Population variance is Σfx²/50 − (Σfx/50)² = 2,873/50 − 7.3² = 4.17 hours².',
        'Take the square root: √4.17 ≈ 2.0421 hours, which rounds to 2.04 hours.'],
      checks:['I multiplied every value and squared value by its frequency.','I divided by all 50 students for the population standard deviation.','I took a square root and kept the final unit in hours.']}
  ].forEach(function(item){items.push(Object.assign({subject:'Mathematics',collection:'WAEC 2021 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2021,paper:'2',source:'https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq'+item.number+'.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Selected task in adapted form; independently worked solution by AfroTools. Not a complete paper.'},item));});
  [
    {id:'waec-2021-mathematics-p2-q7',number:7,title:'Plot a quadratic and compare it with a line',
      prompt:'For integer x from −4 through 4, complete a value table for y = 2x² − x − 2. Plot the curve and the line y = 2x + 3 on the same axes. From their crossings, estimate the roots of 2x² − 3x − 5 = 0. From the curve, state where 2x² − x − 2 is negative.',
      answer:'Table values in x order −4 to 4: 34, 19, 8, 1, −2, −1, 4, 13, 26. The curve and line meet at x = −1 and x = 2.5. The inequality holds for (1 − √17)/4 < x < (1 + √17)/4, approximately −0.781 < x < 1.281.',
      steps:['Substitute each integer from −4 to 4 into f(x) = 2x² − x − 2. For example, f(−3) = 18 + 3 − 2 = 19 and f(4) = 32 − 4 − 2 = 26. Use a consistent scale and join the plotted points with a smooth upward-opening curve.',
        'Plot g(x) = 2x + 3 on the same axes. At a crossing, f(x) = g(x), so 2x² − 3x − 5 = 0. The graph gives about −1 and 2.5; factoring (2x − 5)(x + 1) confirms those roots exactly.',
        'For f(x) < 0, read where the quadratic is below the x-axis, not where it is below the straight line. Solve 2x² − x − 2 = 0 to check the boundary values: x = (1 ± √17)/4, about −0.781 and 1.281.',
        'Because the inequality is strict, the boundary values are excluded. A hand-drawn graph gives approximate readings; the radical expressions are exact.'],
      checks:['My table has nine x-values and f(−3) = 19, f(4) = 26.','I used crossings of the two graphs for the equation roots.','I used the quadratic’s x-axis crossings and excluded both endpoints for the strict inequality.'],
      figure:'quadratic-line',figureAfterAnswer:true,figureCaption:'Solid curve: y = 2x² − x − 2. Dashed line: y = 2x + 3.',figureAlt:'Original coordinate graph with a solid upward-opening curve y = 2x squared minus x minus 2 and a dashed line y = 2x plus 3. The graphs cross at x = minus 1 and 2.5. The curve crosses the x-axis near minus 0.781 and 1.281. Axes run from x minus 4 to 4 and y minus 5 to 35.'},
    {id:'waec-2021-mathematics-p2-q8',number:8,title:'Right-triangle ratio and ages',
      prompt:'In right triangle PQR, the angle at Q is 90° and its area is 216 cm². The perpendicular sides PQ and QR have ratio 3:4. Find the hypotenuse PR. Separately, a parent is 47 years old and their child is 17. Find how many years from now the parent will be twice the child’s age.',
      answer:'PR = 30 cm; the age relationship holds in 13 years.',
      steps:['Write the perpendicular sides as 3k and 4k. The area equation is (1/2)(3k)(4k) = 216, so 6k² = 216 and the positive length scale is k = 6.',
        'The two legs are 18 cm and 24 cm. Pythagoras gives PR = √(18² + 24²) = √900 = 30 cm. The 3:4:5 ratio gives the same check.',
        'Let t be years from now. Then 47 + t = 2(17 + t), giving t = 13. Check: the ages will be 60 and 30.'],
      checks:['I used the two perpendicular sides, not the hypotenuse, in the area formula.','I chose the positive scale k and gave PR in centimetres.','I added the same elapsed time to both ages and checked the result.'],
      figure:'right-triangle-ratio',figureCaption:'Right angle at Q. The drawing is not to scale.',figureAlt:'Original right-triangle schematic: Q is the right-angle vertex, perpendicular sides PQ and QR are labelled 3k and 4k, and PR is the unknown hypotenuse. The drawing is not to scale.'},
    {id:'waec-2021-mathematics-p2-q9',number:9,title:'A trapezium from a triangle and an angle',
      prompt:'In trapezium PQRS, QR is parallel to PS. Perpendiculars from Q and R meet PS at U and T. PU = 5 cm, QU = 12 cm, ∠TSR = 50°, and triangle PQR has area 20 cm². Find the perimeter to the nearest centimetre and the area to the nearest square centimetre.',
      answer:'Perimeter = 50 cm; area = 130 cm².',
      steps:['Triangle PQR has base QR and height 12 cm. Thus 20 = (1/2) × QR × 12, giving QR = 10/3 cm. The perpendiculars form a rectangle, so UT = QR.',
        'The left right triangle gives PQ = √(5² + 12²) = 13 cm. In right triangle SRT, sin 50° = 12/RS and tan 50° = 12/ST. Therefore RS = 12/sin 50° and ST = 12/tan 50°.',
        'The lower parallel side is PS = PU + UT + TS = 5 + 10/3 + 12/tan 50° ≈ 18.40 cm. Perimeter = 13 + 10/3 + 12/sin 50° + PS ≈ 50.40 cm, or 50 cm to the nearest centimetre.',
        'Area = (1/2)(QR + PS) × 12 ≈ 130.41 cm², or 130 cm² to the nearest square centimetre. Keep full calculator values until the final rounding.'],
      checks:['I used QR as the base of triangle PQR and 12 cm as its height.','I derived ST from tan 50° and RS from sin 50°.','I used both parallel sides in the trapezium area formula and rounded only the final results.'],
      figure:'trapezium-geometry',figureCaption:'Original schematic of the labelled trapezium; not to scale.',figureAlt:'Original schematic: trapezium PQRS has upper side QR parallel to lower side PS. Dashed verticals QU and RT meet PS at U and T. PU is 5 centimetres, QU is 12 centimetres, angle TSR at S is 50 degrees, and diagonal PR shows triangle PQR.'},
    {id:'waec-2021-mathematics-p2-q10',number:10,title:'Two farm bearings and a ladder',
      prompt:'A cottage C is on bearing 200° from farm D and bearing 110° from farm M. The straight-line distances DC and MC are 5 km and 3 km. Sketch their positions, then find the distance DM to two significant figures and the bearing of M from D to the nearest degree. Separately, a 10 m ladder reaches the top of a wall x m high, while its foot is x + 2 m from the wall. Find x.',
      answer:'DM = 5.8 km; bearing of M from D = 231°; wall height x = 6 m.',
      steps:['Reverse the given directions to sketch from C: D lies on bearing 020° and M on bearing 290°. Those rays are 90° apart, so triangle DCM is right-angled at C.',
        'Use Pythagoras: DM = √(5² + 3²) = √34 ≈ 5.831 km, which is 5.8 km to two significant figures.',
        'At D, the angle between DC and DM is arctan(3/5) ≈ 30.96°. The bearing from D to C is 200°, so the bearing from D to M is 200° + 30.96° ≈ 231° to the nearest degree.',
        'For the ladder, x² + (x + 2)² = 10². This becomes (x + 8)(x − 6) = 0. A height cannot be negative, so x = 6 m; the foot is 8 m from the wall and 6² + 8² = 10².'],
      checks:['I reversed both given farm-to-cottage bearings before sketching.','I measured the requested bearing from D, clockwise from north, and rounded the distance and angle as requested.','I rejected the negative ladder height and checked the 6–8–10 triangle.'],
      figure:'farm-bearings',figureAfterAnswer:true,figureCaption:'Original farm-and-cottage sketch. North is up; the drawing is not a map.',figureAlt:'Original sketch: from cottage C, farm D is northeast and farm M is northwest. Segments DC and MC are labelled 5 kilometres and 3 kilometres. The angle DCM is a right angle; north points upward.'}
  ].forEach(function(item){items.push(Object.assign({subject:'Mathematics',collection:'WAEC 2021 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2021,paper:'2',source:'https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq'+item.number+'.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Selected task in adapted form; independently worked solution by AfroTools. Not a complete paper.'},item));});
  [
    {id:'waec-2021-mathematics-p2-q12',number:12,title:'Circle angles and a coordinate distance',
      prompt:'P, Q, R and S lie on a circle in that order. Chords PQ and QS have equal lengths, ∠SPR is 26°, and the angles of triangle PQS are in the ratio 2:3:3. Find ∠PQR, ∠RPQ and ∠PRQ. Separately, P = (7, 3), Q = (5, x), and PQ = √29 units. Find every real value of x.',
      answer:'∠PQR = 71°; ∠RPQ = 41.5°; ∠PRQ = 67.5°; x = −2 or 8.',
      steps:['Equal chords PQ and QS give equal opposite angles at S and P in triangle PQS. The ratio has eight parts, so one part is 180°/8 = 22.5°. Thus ∠PQS = 45° and ∠SPQ = ∠PSQ = 67.5°.',
        'Angles ∠SPR and ∠SQR stand on the same chord SR, so ∠SQR = 26°. Hence ∠PQR = ∠PQS + ∠SQR = 45° + 26° = 71°.',
        'At P, ∠RPQ = ∠SPQ − ∠SPR = 67.5° − 26° = 41.5°. The remaining angle of triangle PQR is 180° − 71° − 41.5° = 67.5°.',
        'For the separate coordinate task, PQ² = (7 − 5)² + (3 − x)² = 29. Therefore (x − 3)² = 25 and x = 3 ± 5, giving x = −2 or 8. Both values satisfy the original distance.'],
      checks:['I assigned the equal ratio parts to the angles at P and S.','I used the shared chord SR before subtracting the 26° angle at P.','I kept both real solutions to the distance equation.'],
      figure:'circle-equal-chords',figureCaption:'Original circle schematic. The points and angles are not drawn to scale.',figureAlt:'Original schematic of a circle with P at left, Q at top, R at right and S below. Chords PQ and QS are equal. Chords PR and QS cross, and angle SPR at P is 26 degrees. The drawing is not to scale.'},
    {id:'waec-2021-mathematics-p2-q13',number:13,title:'Three years of interest and a circle angle',
      prompt:'At a child’s first birthday, $1,000 is deposited at 4% interest compounded annually. What is the balance on the fourth birthday? Separately, A, B, C and D lie on a circle. AD passes through its centre O, AB = BC, and ∠ADC = 50°. Find ∠BAD.',
      answer:'Balance = $1,124.86; ∠BAD = 65°.',
      steps:['From the first birthday to the fourth birthday there are three annual compounding periods, not four. The balance is $1,000 × 1.04³ = $1,124.864, or $1,124.86 to the nearest cent.',
        'Draw the auxiliary chord AC. Because AD is a diameter, ∠ACD = 90°. Triangle ACD gives ∠CAD = 180° − 90° − 50° = 40°.',
        'Opposite angles of cyclic quadrilateral ABCD add to 180°, so ∠ABC = 180° − 50° = 130°. Equal chords AB and BC make triangle ABC isosceles, so ∠BAC = (180° − 130°)/2 = 25°.',
        'The requested angle is split by AC: ∠BAD = ∠BAC + ∠CAD = 25° + 40° = 65°.'],
      checks:['I counted three years between the first and fourth birthdays.','I used the diameter to obtain the right angle at C.','I combined the 25° and 40° angles at A.'],
      figure:'diameter-equal-chords',figureCaption:'Original circle schematic; AD is a diameter. Not to scale.',figureAlt:'Original schematic of cyclic quadrilateral ABCD. Diameter AD passes through centre O. Chords AB and BC are equal, and angle ADC at D is 50 degrees. An auxiliary chord AC can be drawn to solve the angle.'}
  ].forEach(function(item){items.push(Object.assign({subject:'Mathematics',collection:'WAEC 2021 Mathematics companion',origin:'WAEC source-linked Mathematics task',exam:'WAEC',year:2021,paper:'2',source:'https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq'+item.number+'.html',sourceLabel:'Read the exact WAEC question',sourceUse:'Selected task in adapted form; independently worked solution by AfroTools. Not a complete paper.'},item));});
  return {version:1,id:'ssce-written-v1',reviewedAt:'2026-09-28',items:items,scope:'12 original Mathematics tasks, 5 original English tasks, 41 WAEC Mathematics companions, 10 WAEC English writing companions, 4 WAEC English reading companions, 58 NECO Mathematics companions, 4 NECO English writing companions and 2 NECO English reading companions. Not a complete WAEC or NECO paper. Written answers are self-reviewed, not automatically graded.'};
});
