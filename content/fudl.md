# Fudl

### What is Fudl?

Fudl is a computer vision project I've been building seriously since July 2026, after earlier experiments. Flag football has almost no data or analytics, so I'm building a pipeline that watches game film and extracts that data automatically. It finds every play, times the snap, maps the camera image onto the real field in yards, detects and tracks every player, separates the two teams and the officials, and cuts each game into individual plays with a bird's-eye view of the routes.

It's a personal project. I make the design decisions, and I run every experiment against labelled data I built myself. It is a work in progress. Some stages are measured and working, some are proven on a few games, and some are still planned. Each answer below says which.

### What footage did you work with?

32 games, about 29 hours of game time, from four sources of public tournament footage:

- 9 games from a European Championship broadcast (some of them games I played in). H.264, 720p, 25 fps, painted field.
- 9 games from a second field at the same championship. 720p, 25 fps, painted field.
- 8 games from a club tournament in Copenhagen, played in a public park. AV1, 1080p, 29.97 fps. There are no painted lines at all, only orange cones and boundary tape, and other games run on the same grass.
- 6 games from a Portuguese tournament. 720p, 60 fps, cones plus leftover lines from American football.

I added the Copenhagen footage on purpose as a held-out second source. Until then everything came from one broadcast, so I had no way to measure whether anything transferred to new footage. All the footage is for personal learning use only.

### How did you build the dataset?

No labelled flag football dataset exists, so every label is my own. I built them in layers, using each tool to make the next round of labelling cheaper:

1. **Snap candidates.** A simple motion detector proposed moments that might be snaps. For each one I reviewed a 9-frame grid and answered snap / not a snap / unsure. On the 9 European games that was 912 candidates: 622 snaps, 286 not, 4 unsure. All 17 games from the first two sources were fully reviewed this way.
2. **Watch-through ground truth.** The grid review can only judge candidates that were already proposed, so it can't see a missed snap. I watched full games end to end and marked every snap: 84 in one European game and 77 in one Copenhagen game. This is how I measure recall.
3. **Frame-accurate truth.** I built a labelling tool that steps one frame at a time and re-marked both games frame by frame. It showed that my original whole-second marks were consistently early (by 0.57 s on one game and 0.65 s on the other), because the video player truncates its clock. Some conclusions from earlier experiments only held because of that bias, so I corrected them.
4. **Measuring my own error.** Comparing the two labelling methods showed both are about 99% accurate, and they fail in opposite directions. The grid review is fooled by replays and pre-snap movement, and the watch-through occasionally misses a snap at speed. Cross-checking them catches both kinds of error.
5. **Player roles.** For the detector I hand-corrected 414 frames from one game, then 390 more frames from 13 other games, with four classes: player, official, other person and centre (the player who snaps the ball). The model pre-labelled each frame and I corrected it, which is much faster than drawing every box.
6. **Cones and field lines.** I labelled 136 frames of cones by hand across 24 games. More cone labels were generated automatically by projecting known cone positions through field maps I had already verified. A smaller set of field-line labels covers two games.
7. **Field maps.** I clicked reference points on known field markings, and those clicks became the training signal for automating the mapping.

The pattern repeats through the whole project: a crude method creates candidates, I label them, a learned model replaces the crude method, and the model then finds what the crude method missed.

### How does snap detection work?

It went through three generations.

**1. A motion heuristic.** Frame differencing on downscaled frames, then flag a burst of motion that follows a quiet moment. I tuned it with a grid search over 840 settings against the hand-labelled truth. Recall went from 83.5% to 91.8% on the European test game and from 85.7% to 96.1% on the Copenhagen one, 93.8% combined. Precision against the reviewed candidates was about 68.5% on the European games and 60.5% on Copenhagen.

**2. A video classifier.** I fine-tuned a 3D-CNN action-recognition model (pretrained on Kinetics-400) on 2,871 clips cut around every candidate, plus background clips from the rest of the game. Then I slid it across every position in each game, not only at the candidates. Against the frame-accurate truth with an 8-second matching window:

- European test game: 97.6% recall, 95.4% precision
- Copenhagen test game: 100% recall, 91.7% precision

It beat the heuristic on recall and precision at the same time, even though it was trained on clips the heuristic chose. It learned what a snap looks like, not what the heuristic fires on. The background clips were essential: a model that only ever saw candidate moments would fire on every huddle.

**3. Precise snap timing.** The classifier finds plays, but not the exact moment of the snap. It scores a 12-second window, so its timing has a standard deviation of about 2.9 seconds (it is unbiased, the spread is the problem). To time the snap I combine two signals:

- **Finding the centre.** The player snapping the ball is the one bent over it. A posture rule (smallest height-to-width box ratio, about 1.0 against 2.5–3.5 for a standing player) found a crouched candidate on every play of the test game, and the ratio doubles as a confidence score. Later I added "centre" as a class in the detector.
- **Player motion onset.** The median speed of the players in real field yards, so camera motion is already removed. The snap is the first sustained crossing of an absolute speed threshold, corrected for a measured lag.

On the European test game, 62% of snaps are timed within 0.2 s, 93% within 0.5 s and 96% within 1 s. For comparison, the classifier alone gets only 9–17% within 0.5 s, depending on which set of plays is compared. On the Copenhagen test game it's 48% / 69% / 76%. That gap comes mostly from finding the centre, which is harder on that footage (see the generalisation answer).

### How does field mapping work on a painted field?

The goal is a homography: a mapping from image pixels to field coordinates in yards. That lets me measure real positions and speeds, and separate players from the bench.

- **Manual proof first.** On one game I clicked four corners on known yard lines and sidelines. The bird's-eye view immediately separated players from bystanders, with an empty band of 1–4 yards along the sideline. I later anchored the clicks to real, readable yard-line numbers so that positions are absolute. Five consecutive plays then showed the offence moving down the field: 46 → 45 → 38 → 35 → 20 yards.
- **One map per play isn't transferable.** Reusing one play's map on another play costs 2.6 to 46 yards of error, because the camera pans and zooms.
- **Image registration fixes it without more clicking.** I match each play's frame to a small set of clicked reference frames using SIFT features on the static background (with players masked out), fit the transform with RANSAC, and compose it with the reference's map. With 11 clicked references, all 87 plays of the test game got a map with zero failures, about 8 plays per click. Because the camera returns to framings it used earlier, it's important to try every reference, not just the most recent one. Trying only the most recent needed 32 references instead of 11.
- **Calibrating the cut-off.** I validated each reference against every other reference (110 pairs). Match quality is a cliff, not a slope. Below 50 inlier matches the error is tens of yards, above 100 it is a fraction of a yard (median 0.17–0.25 yd), and between 50 and 100 it is unreliable. So I set the threshold at 100 and always take the strongest reference.
- **The cross-check also catches my own mistakes.** Two references disagreed with their partners by 2–37 yards despite strong matches. That meant the clicks were wrong, not the matching. Both were fixed, and after that every reference agreed with its partners to 0.10–0.21 yards.

**In progress:** a fully automatic version that fits a physical camera model (fixed position, with pan, tilt, zoom and roll) to detected field lines. In a first probe on 12 plays it reached a median 1.3 yd, which is not good enough yet. Lines alone are ambiguous because they repeat every 5 yards, so the plan is to let lines drive the precision and use cones only to break the 5-yard ties.

### How does field mapping work on a field with only cones?

The Copenhagen park has no painted lines, which made this the hardest stage. A single frame usually shows only 2–3 cones, often all on the far sideline, so there isn't enough geometry for a map. My approach:

1. **Build a panorama of the whole game.** I estimate a rotating-camera model (per-frame focal length and rotation, refined with bundle adjustment) instead of stitching flat images. My first, planar version placed only 40 of 84 frames and looked stretched. The rotation model placed all 84 and showed both ends of the pitch in one image. Broadcast overlays had to be detected and masked automatically, because they "vote" that the camera never moved.
2. **Name the cones once per game.** Clicking the cones in the panorama and assigning each one its field position gives a single map that works for every frame. On the first game, 21 clicks on 7 cones gave fit errors mostly under 0.5 yd. On the second, the median was 0.18 yd.
3. **Automate the clicking.** I trained a cone detector: precision 0.91, recall 0.82, mAP50 0.88 on held-out data from 29 games. Each detected cone becomes a viewing ray. Rays are clustered across the whole game, and the clusters are named by trying the possible assignments to the known cone layout. On a game I had also clicked by hand, the automatic map matched the clicked one to a median 0.39 yd (worst 0.60 yd) over 82 plays. On a game I had never clicked, it named all 10 cones, and the result looked right when I checked it visually.
4. **Follow the camera during the play.** The camera pans after the snap, so a single map per play bends the routes. Frame-to-frame optical flow on the background chains the map through the pan.

**Status:** automatic cone mapping works on some games and fails on others. On one game every detected cone was on the far sideline, so the naming broke and that game needs manual clicks. Fitting a camera to two cones in a single frame also failed: any wrong pair of cones fits exactly. Combining evidence across many frames is what makes it work.

### How do you detect and track players?

- **Detection.** A pretrained YOLO detector finds people easily (confidence 0.76–0.92). The hard part is telling who is a player, an official, a coach or a spectator. So I fine-tuned YOLO11 on my own four classes. Version 1 (one game, 414 frames) reached mAP50 0.97 on held-out plays, including 0.98 for officials and 0.95 for the centre. Version 2 added frames from 13 more games and raised the Copenhagen score from 0.70 to 0.91 with no regression on the original game.
- **Tracking.** BoT-SORT with camera-motion compensation. Raw tracks are fragmented: about 47 track IDs for about 26 real people on a play. I added a stitching step that joins track pieces when the gap and distance are physically possible and the team matches. Unlabelled player rows went from 15.0% (raw tracks) to 9.5% (stitching) to 2.3% (stitching plus a team fallback).
- **Team-aware tracking.** The tracker sometimes swapped two players from opposite teams after an occlusion. Adding a team-consistency rule inside the tracker cut those swaps on four test plays from 2 / 2 / 1 / 8 to 0 / 0 / 0 / 1. Zooming in and re-detecting made it worse.
- **Speed.** Hardware is a laptop RTX 3060 with 6 GB of memory, plus free cloud GPUs for batch jobs. Exporting the detector to TensorRT FP16 nearly doubled detection speed (21.6 → 40.9 fps) with 99.9% of boxes unchanged. Profiling then showed that the tracker's camera-motion step on the CPU was the real bottleneck, so I downscaled that step.

**Open problem:** only about half of the plays show exactly 5 vs 5 players at the moment before the snap. I tested and ruled out the sideline cut-off, the duplicate-box filter and forcing the count. The missing players are never tracked at that moment, so the cause is occlusion in the tracker.

### How do you tell the two teams and the officials apart?

- **Kit colour, without typing a colour.** On the first game, the median torso hue across several patches is cleanly bimodal, and a circular two-cluster fit finds both kit colours on its own. It has to be circular, because red wraps around the end of the hue scale. At the moment before the snap the two teams sit 8.6 yards apart on 77 of 78 plays, and only 1.0% of players fall on the wrong side of the best dividing line. The kits also came out balanced (345 vs 340 placements) without the pipeline being told the game is 5v5.
- **Officials.** Four colour-based rules failed. The officials wore black-and-white stripes, which in colour space sit right next to the white kit. ImageNet ResNet-18 embeddings with k-means worked better (about 97% precision, but weak recall). Two details mattered: letterboxing the crops instead of stretching them, and using 12 clusters instead of 3, because the embedding separates pose as strongly as clothing. In the end, the most reliable solution was making "official" a class in my detector.
- **When colour fails completely.** In the Copenhagen game the teams wear black and white, two colours with no hue, so the colour method has nothing to split. My fix: at the set, the line of scrimmage splits the two teams spatially, which gives free labels. I train a small per-game classifier on image embeddings from those labels. On held-out plays it classifies 96.8% of players correctly, against 79% agreement for the colour method. The caveat is that it was scored against those line-of-scrimmage labels and only at the set, not mid-play.
- **Which team has the ball.** The offence is the centre's team. Across a game, that gives 22 possession streaks over 87 plays, against about 44 for random guessing, which is what real possession looks like. My first idea, "the offence is the group moving forward", was indistinguishable from random, because both teams converge at the snap instead of moving in one direction.

### How do you cut a game into individual plays?

A play starts at the snap. For the end, I use what officials do: after a play, a referee walks to the spot of the next play. The cut ends shortly before the official reaches that spot. If no official is found, it falls back to a fixed 12 seconds after the snap. Plays with low classifier confidence and no detected centre are dropped as false detections.

**Status:** cut videos exist for 26 of the 32 games, and the Portuguese games are still being processed. Across all 32 games the classifier detected 2,665 plays. I've only measured accuracy on the two hand-labelled games, so I don't quote a recall figure for the rest. In the Copenhagen footage about 22% of plays still use the 12-second fallback. The next step is to end plays using player movement (the ball carrier stopping) together with the referee rule.

### How well does it generalise across different footage?

Generalisation is the main theme of the project, and each new source broke something:

- **Codec and frame rate.** The Copenhagen footage is AV1 at 29.97 fps. OpenCV decoded it about 11× slower than ffmpeg (38.6 s against 3.3 s per minute of video), so I moved decoding to ffmpeg. That footage was also 25 fps content padded by repeating one frame in six, which broke the motion detector's "sustained motion" rule and gave **zero snap candidates for a whole game**. A small fix that bridges the repeated frames restored detection on every Copenhagen game, at a cost of about 1.5 points of precision on the European games.
- **Snap detection** transferred well: the classifier reached 100% recall on the Copenhagen test game.
- **Replays.** Every false positive on the Copenhagen test game was a replay shown 13–25 seconds after a real snap. They score low, so they are separable, but this is something one broadcast had and the other didn't.
- **Player roles.** The first detector, trained on one game, scored mAP50 0.70 on Copenhagen. Adding a few hundred labelled frames from other games raised that to 0.91.
- **Field mapping** needed a different method per venue type: image registration on painted fields, panorama plus cones on unmarked ones.
- **Snap timing** is the clearest remaining gap. On the European test game 93% of snaps are within 0.5 s, against 69% on Copenhagen, mostly because finding the centre is harder there.

I always test changes on the same European baseline game first, then on the other sources.

### What approaches failed, and what did you learn from them?

- **A pre-snap stillness filter** to remove false snap candidates. By construction, every candidate is already preceded by a quiet moment, so it filtered nothing. A single global motion number can't separate snaps from other bursts; that needs appearance, which is why I moved to a learned model.
- **A tuning setting that looked best on precision.** It got there by proposing fewer candidates and dropped recall on the Copenhagen game to 67.5%. Scoring against reviewed candidates can't see this, because only proposed candidates get a verdict. Only the full watch-through caught it.
- **A train/inference mismatch.** The classifier was trained on 16-frame clips but fed 32 frames at inference. It still ran, but the probabilities were flattened. Fixing it improved accuracy and made scoring about twice as fast.
- **Detecting the ball.** The ball is visible, but my detector either locked onto the player's dark hair or shorts, or, when I required grass around it, rejected the real ball because it touches the player. I dropped it and use the centre's position instead.
- **Colour rules for officials** (four variants) and **"offence = the team moving forward"**, both covered above.
- **A planar panorama**, replaced by a rotation-based one.
- **Fitting a camera to two cones per frame**, replaced by combining cones across the whole game.
- **Lines alone for automatic mapping.** They correct a rough map well (1.4 → 0.3 yd median) but can't create one, because lines repeat every 5 yards.
- **Forcing exactly five players per team.** It didn't help, which pointed to tracking as the real cause.

### What trade-offs did you choose?

- **Recall over precision, at first.** The early detector was a candidate collector for labelling. A false positive costs me one keypress to reject, while a missed snap is never reviewed and becomes a wrong "background" example in training. So I tuned for recall and accepted lower precision.
- **Detection threshold set low (0.1).** Later stages only run inside detected plays, so a missed play can't be recovered downstream. I re-check this threshold after every retrain, because one fix alone moved the curve significantly.
- **One painted-field venue first, then unmarked fields.** I built field and player stages on the painted European field, where four clicks give a map, and treated the unmarked park as the transfer test afterwards.
- **A few clicks per game instead of zero, for now.** About 11 clicks map a full painted-field game, and one round of cone clicks maps a Copenhagen game. Every click also becomes training data for the automatic version.
- **The strongest reference over the first adequate one.** That makes registration about 3× slower (16 s → 45 s per game), but it raises the weakest match from 101 to 149 inliers, well away from the cliff at 50.
- **Measurement before algorithm.** When snap-timing accuracy hit the limit of my labels, I built frame-accurate labels before trying any more algorithms.
- **Laptop GPU plus free cloud GPUs.** Training runs at batch size 2 to fit in 6 GB, and long detection jobs run in the cloud.

### What were the hardest problems?

1. **Mapping fields with no markings.** Only a few cones per frame, often all on one side, on shared grass with other games nearby. It needed a game-wide panorama, a cone detector and an assignment search to work at all.
2. **Timing the snap to within fractions of a second**, which meant finding the right player (the centre) before using motion. On new footage the posture rule can pick a crouching defender instead, which flips which team is on offence.
3. **Measuring things honestly.** My own labels were half a second off, one labelling method was blind to misses and the other to replays, and a promising setting was hiding a recall drop. A lot of the work was building instruments I could trust.
4. **Tracking through occlusion**, which is the remaining reason only about half of the plays show a clean 5 vs 5.
5. **Teams with no colour difference** (black vs white), solved by learning each game's kits from the line of scrimmage.

### What results have you measured?

All numbers are on held-out or hand-labelled data:

- **Play detection:** 97.6% recall / 95.4% precision (European test game) and 100% / 91.7% (Copenhagen test game), against frame-accurate truth.
- **Snap timing:** 93% of snaps within 0.5 s on the European test game, 69% on Copenhagen. The classifier alone gets 9–17% within 0.5 s.
- **Field mapping, painted field:** 87 of 87 plays mapped from 11 reference clicks. Cross-validated references agree to 0.10–0.21 yd.
- **Field mapping, cones only:** automatic cone naming matches hand-clicked maps to 0.39 yd median over 82 plays on one game. It works on some games and fails on others.
- **Cone detector:** precision 0.91, recall 0.82, mAP50 0.88.
- **Player/official/centre detector:** mAP50 0.97 on the training venue. On Copenhagen it went from 0.70 to 0.91 after adding multi-game labels.
- **Team separation:** 1.0% of players on the wrong side at the set (colour kits). 96.8% per-player accuracy where colour fails (learned per-game kits).
- **Scale:** 32 games and about 29 hours of game time processed by the play detector, 2,665 plays detected, and cut videos produced for 26 games.

### What's done, what's in progress, and what's next?

**Done and measured:** play detection, snap timing on the European footage, painted-field mapping through registration, the player/official/centre detector, team separation (by colour and by learned kits), and play cutting for 26 games.

**Working but not finished:** automatic cone-based mapping (works on some games, fails when every cone is on one sideline), snap timing on the Copenhagen footage, play-end detection (about 22% fallback on Copenhagen), and tracking through occlusion (about half of plays show a clean 5 vs 5 at the set).

**Next:**

- Make field mapping automatic on painted fields too, using detected lines for precision and cones to remove the 5-yard ambiguity.
- Retrain the centre detector on the plays it missed, and use where the referee spots the ball as an independent check on the centre.
- Track possession across plays, including interceptions.
- End plays using player movement as well as the referee rule.
- Turn per-play routes into analysis: formations, routes and tendencies.
- Longer term: make it work on any footage a team records itself, which is why generalising to new venues matters so much.
