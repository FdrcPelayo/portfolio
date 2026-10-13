# CV: Francisco Pelayo

## Summary

I'm Francisco Dias Ribeiro e Casal Pelayo, a Computer Science and Engineering MSc graduate from the Technical University of Denmark (DTU), finished July 2026. Before that I did a BSc in Electrical and Computer Engineering at ISEP in Porto, Portugal. I came to Denmark to build a strong foundation in algorithms and machine learning, and used my electives to go deeper into deep learning and computer vision.

I'm looking for a graduate or junior role in machine learning, computer vision or AI research, ideally on a team that values learning, growth and experimentation. I'm based in Copenhagen, Denmark.

## Master's thesis: Explainable AI for time-series data (DTU, 2026)

A two-person thesis, written with a fellow student. I focused more on the synthetic ground-truth dataset and the learning-based method; my colleague focused more on the AudioMNIST experiments and the sampling-based side.

- Extended a sampling-based (perturbation) explainability framework to the wavelet domain, and developed a new learning-based mask framework for the time-frequency and wavelet domains, plus evaluation metrics that work in those domains.
- Validated the methods on purpose-built synthetic data with known ground truth, then on real-world audio (AudioMNIST, spoken-digit recognition).
- Main finding: sampling-based methods are faster and easier to deploy but give noisier, less concise explanations; learning-based methods need more expertise but give clear, precise, highly relevant explanations and can be tuned with constraints and regularisation. Both are viable and can be combined.
- Also found that current XAI evaluation metrics often don't match what the explanations visibly show.
- A paper based on the thesis, adding a comparison against LRP (Layer-wise Relevance Propagation), is currently under peer review. Built in PyTorch.

## Fudl: flag football video analysis (personal project, main development since July 2026)

A computer vision pipeline that turns flag football game film into data: it finds every play, times the snap, maps the camera image onto the field in yards, detects and tracks players, separates teams and officials, and cuts games into individual plays. The machine learning and computer vision side is my solo work; a friend will build the front end. The repository is private while in development. Full details are in the Fudl write-up.

- Built every label myself, in layers: a motion heuristic proposed snap candidates, I reviewed them, then a fine-tuned 3D-CNN video classifier replaced the heuristic.
- Play detection: 97.6% recall / 95.4% precision on a European test game and 100% / 91.7% on an unseen Copenhagen game, against frame-accurate hand labels.
- Snap timing: 93% of snaps within 0.5 s on the European test game, by finding the centre's crouched posture and the onset of player motion in field coordinates.
- Field mapping with homographies: SIFT + RANSAC registration on painted fields (87 of 87 plays mapped from 11 clicks), and a panorama plus a cone detector on unmarked park fields.
- Fine-tuned YOLO11 for players, officials and the centre (mAP50 0.97), with BoT-SORT tracking and team separation by kit colour or learned per-game embeddings.
- Scale so far: 32 games, about 29 hours of footage, 2,665 plays detected.

## Embedded Systems Engineer Intern: Evoleo Technologies (Porto, 2023, 4 months)

- Designed a long-life IoT sensor system for railway track monitoring.
- Selected components, and scheduled power states and communication routines to maximise battery life for autonomous, long-term operation.
- Wrote the firmware in C on an RTOS, targeting low-power operation.

## Other projects

- **AI-generated image detection** (DTU deep learning group project): identifying artefacts in AI-generated images and how they degrade as images spread and get re-shared online.
- **Generative data in Blender**: scripted Blender to generate synthetic 3D data for a generative methods for computer graphics course.
- **Image analysis**: image processing fundamentals with OpenCV, including medical imaging work.
- **Additive manufacturing innovation challenge**: my team won a challenge run by a Danish AM (3D printing) hub, conceptualising an innovative AM product.
- **Bachelor's project**: an image classification project in Porto, which is where my interest in applied AI started.

## Skills

- **Languages:** Python, C
- **ML and CV:** PyTorch, NumPy, pandas, scikit-learn, OpenCV, YOLO, ResNets 
- **Tools:** Jupyter and Colab, Bash scripting, Git, LaTeX
- **Design:** Figma (project work), user experience engineering
- **Background from electrical engineering:** signal processing, embedded systems, RTOS firmware
- **Spoken languages:** Portuguese (native), English (C1)

## What I want to learn next

I'm keen to get into production ML work: cloud platforms (e.g. Azure), SQL and data engineering. I've done introductory SQL and some HTML and CSS during my bachelor's, and I spend my own time learning new tools.

## Contact

- Email: francisco.drcp@gmail.com
- LinkedIn: linkedin.com/in/fdrcpelayo
- GitHub: github.com/FdrcPelayo
