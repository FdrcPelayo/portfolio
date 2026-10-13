# Portfolio Knowledge Base

_(Source material for my portfolio chatbot. Answers are in my own words, lightly cleaned up from voice recordings.)_

## 1. Intro & Background
### Tell me about yourself.
I'm Francisco, from Portugal. I recently graduated in Computer Science from the Technical University of Denmark (DTU), specializing in the AI and Algorithms study line. I'm now looking for an entry-level, junior role where I can get my start in the industry and grow into a well-rounded professional.

### What kind of role are you looking for right now?
An entry-level / junior position. I'm most interested in machine learning for computer vision: analyzing images and video. More broadly, I'm passionate about data as a whole: manipulating it, extracting information from it, and preparing it so that machine learning models perform better.

The roles I'm targeting are software engineering, data science, and ML roles. I'm open to research-oriented positions, since they fit my academic background well, but I'd be just as motivated to join a more development- and product-focused team.

### How did you get into this field?
My bachelor's was in Electrical and Computer Engineering. In the last semester we had some freedom to explore, and I took an introductory course in artificial intelligence. I loved it, especially the idea of using math to make a machine "think." A small project in that course made me realize I needed to know more, so I did my bachelor's project in the same area and then looked for a master's degree focused on AI. That's what brought me to Copenhagen and DTU.

Computer vision in particular hooked me because it's so tangible: you can literally look at the results and see how the math turns into real information.

## 2. Experience
### Walk me through your current or most recent role.
I haven't yet had professional experience directly in ML or computer vision. My industry experience is an internship at Evoleo Technologies, in embedded systems engineering.

My task was to develop an Internet of Things (IoT) device to remotely monitor a railway track. The goal was a low-power device you could simply install and leave, sending data back without needing maintenance. I designed the layout of the electrical components, and I programmed the device's operating routines: the power modes and the messaging routines.

Because of the internship's time frame, the work stayed at the development-board prototype stage. But based on my final presentation and the feedback from the senior engineers supervising me, it was a very good result.

### Have you had any other work experience?
Alongside my studies in Denmark, I worked part-time jobs in construction. It's unrelated to tech, but it taught me a lot. It gave me a real feel for Danish work culture, and it taught me to learn from my mistakes, to motivate myself and get things done independently, and to dive into work I'd never done before. That last one was a really valuable lesson.

### Tell me about your master's thesis.
**Topic:** Explainable AI (XAI) for time series. Thesis title: *XAI for Time Series*. It was a two-person thesis, written together with a fellow student.

**My role:** The work ended up being very collaborative, but we each put more emphasis on certain parts. I focused more on designing and developing the **synthetic ground-truth dataset** and on the **learning-based method**, while my colleague focused more on the **AudioMNIST** experiments and the **sampling-based** side.

**Goal:** Find explanation frameworks that reveal which input features a model actually relies on for its decisions.

**Approach:**
We worked with two families of mask-based explanation methods. Both place a mask over the input and measure which parts contribute most to the model's decision:
- **Sampling-based** (perturbation) masks
- **Learning-based** masks, where the mask itself is optimized

A big part of the work was **transformation domains**. Time-series information isn't only visible in the time domain; transforming it reveals additional structure. We worked across:
- Time domain
- Frequency domain (Fourier transform)
- Time-frequency domain
- Wavelet domain

The goal was to extend both frameworks to all of these domains, so we could compare how each method behaves depending on the representation it's given, and evaluate how the model uses information in each.
- The **sampling-based** framework already supported time, frequency and time-frequency, so we extended it to the **wavelet domain**.
- The **learning-based** framework only supported time and frequency, so we **developed a new framework** using the same mechanism for the **time-frequency and wavelet domains**.
- We also had to extend the evaluation metrics to work in these new domains.

**Data & evaluation:**
One of the biggest problems in explainability is that evaluation methods aren't a foolproof way of proving an explanation is correct. So we first tested on a **synthetic dataset with known ground truth**, to see exactly how each framework extracts information in each domain. We then scaled up to **AudioMNIST** (spoken-digit recognition) and used what we'd learned on the synthetic data to interpret the results.

**Findings:**
- **Sampling-based methods** are much faster and easier to deploy. However, their explanations are less clean and concise, they're more sensitive to noise, and visually it's harder for an outsider to tell what's relevant. Even so, they score very well on current state-of-the-art XAI metrics, partly because many of those metrics are built on the same concept as sampling.
- **Learning-based methods** are harder to deploy and require more expertise. But their explanations are very clear and precise, highlighting only a small amount of information, and that information scores highly for relevance to the model. They're also much more customizable through constraints and regularization, so if you know what to expect, you can tune them to exploit that knowledge.
- **Both are viable**; the choice depends on the data and the user's expertise, and they can even be used together.
- We also kept finding that **current XAI evaluation metrics are lacking**: their scores didn't match what we saw visually, and they're more informative as an overall evaluation than for judging a single explanation.

**Publication:**
The thesis was written with publication in mind, and a paper based on it is **currently under peer review**. The paper builds on our research and reaches the same conclusions, adding a comparison against a well-known baseline, **LRP (Layer-wise Relevance Propagation)**.

A key finding, which our supervisors spotted and considered the most significant: in **insertion-based evaluation** (gradually adding the most relevant features back and tracking the model's score), the sampling-based explanations led the model to score a **higher accuracy than its original prediction**. We hadn't noticed this during the thesis, but it turned out to be one of the most interesting results.

### What's the project you're most proud of?
**Fudl**, a flag football video analysis app I'm currently building. It's where I combine my two passions: AI and sports. I play flag football and represent my national team, and I wanted a project that would really test my skills and prepare me for the job market.

**The problem:** Flag football is a very tactical game, and a huge amount of work happens behind the scenes: analyzing footage, cutting game film play by play, tracing each player's movements, drawing up plays. It takes a lot of time and people.

**The idea:** A coach uploads a broadcast or a game-camera recording, and the app does the rest. It processes the footage, splits it into individual plays, identifies the players, and extracts the game's statistics, giving the coach whatever information they want or request.

**Current status (mid-stage):**
- It already detects the **field**, the **players** and their **routes**.
- It **cuts the game into individual plays** by detecting the snap.
- I'm now working on **generalization**: making it accurate on any kind of footage. Professional footage has marked fields, zoom and replays; amateur footage might have only a few cones on the field and a camera that never zooms in. I want it to handle both.
- Next steps: the **statistical analysis** layer and the **application** itself (the user-facing product).

So far my focus has been on the computer vision and machine learning side.

**Team:** The machine learning and computer vision side is a solo project, done entirely by me. A friend will build the front end. The repository and demo are private for now while the project is in development.

### How does Fudl work technically?
_(Summary from voice; more detail to come from project reports.)_

**1. Building a dataset from scratch (snap detection)**
There was no labeled footage to train on, so the first step was building the dataset. To split a game into plays, you need to know when each play starts, so everything is centered on the **snap**.
- I started with a **heuristic model based on frame differencing** (measuring movement between frames) to find a window where the snap likely happens. It wasn't very accurate, as expected, but it gave me an initial set of frames with and without a snap.
- I used those frames to train a **ResNet** classifier to detect the snap.
- Through trial and error, I found that running the model over a **sliding window** worked best. It isn't frame-exact, but by widening the predicted window slightly, we can be confident the snap occurs inside it, which gave very high precision.

**2. Field mapping**
- **Marked fields:** I started with an approach based on user clicks and the known field markings, using a **homography** to map the image to real-world distances and draw the field.
- **Following the camera:** to map every frame of a play as the camera moves, I used **SIFT** feature matching with **RANSAC**.
- **Unmarked / amateur fields:** where there are no lines, I first had the user click on the cones. It worked really well and needed less user input than the line-based approach, which is more precise but needs more clicks, and minimizing user input is a key goal.
- I then scaled this up to a **cone detection model**. Because the cone distances are fixed, detecting just a few cones in a frame is enough to map the whole field. This is where the project is now.

**3. Player detection and tracking**
- Players are detected with a fine-tuned **YOLO** model that also tells players apart from officials and other people, and tracked with **BoT-SORT**.
- Using the field mapping, detections are constrained to the field boundaries to identify the **active players**.

**4. Team separation**
- **Kit colour:** clustering the players' torso colours finds both teams' kits automatically, with no colour typed in.
- **Officials:** colour rules failed (striped shirts look too much like a white kit), so I made "official" a class in my detector.
- **When colour fails** (for example black vs white kits): at the line of scrimmage the two teams are split spatially, which gives free labels to train a small per-game classifier.

**5. Cutting play by play**
This was the hardest part: knowing where a play starts and ends is a chicken-and-egg problem, since you need game context to extract information, but you need the information to build context. I used my domain knowledge: the centre (the player who snaps the ball) is always **crouched at the snap**, so I detect that posture together with the players' movement to time the snap, which is where each play cut starts. The play ends when a referee walks to the spot of the next play.

### Tell me about a project that failed or didn't go as planned.
_(pending)_

### What's your biggest measurable impact so far?
_(pending)_

## 3. Skills
### What's your core tech stack / toolset?
_(pending)_

### What are you strongest at?
_(pending)_

### What are you currently learning?
_(pending)_

## 4. How You Work
### How do you work in a team?
_(pending)_

### Tell me about a conflict or disagreement and how you handled it.
_(pending)_

### How do you handle tight deadlines or pressure?
_(pending)_

### What kind of manager or team brings out your best?
_(pending)_

## 5. Motivation & Fit
### Why are you leaving / looking for something new?
_(pending)_

### Where do you see yourself in 3–5 years?
_(pending)_

### What's a weakness you're working on?
_(pending)_

## 6. Logistics
### Location, remote/hybrid preference, willingness to relocate?
I'm based in Copenhagen, and that's where I'd like to work. That said, I'm open to relocating if the opportunity is interesting and exciting.

### Availability / notice period?
I'm available to start immediately.

### Work authorization?
As an EU (Portuguese) citizen, I'm fully authorized to work in Denmark and anywhere in the EU, with no visa or sponsorship needed.

### Salary expectations (or how you want the bot to handle this)?
I'm expecting the standard salary for an entry-level position in the relevant role in Copenhagen, and I'm open to negotiation.

## 7. Personal
### What do you do outside of work?
_(pending)_

### Anything a recruiter should know that isn't on your CV?
_(pending)_

### Best way to contact you?
_(pending)_
