*Written for some friends in $<2$ hours, with the goal of giving them some decent sense of the "AI risk landscape."*

This is by no means a definitive list. Thanks to mr. [Cleo Nardo](https://www.lesswrong.com/users/cleo-nardo?from=post_header) for providing some inspiration here. Many sources are taken from this [AI futurism reading list](https://blog.redwoodresearch.org/p/ai-futurism-reading-list), which goes much more in depth. If there is a subject that appears to be important that is missing, which there certainly is, please ask me. Exercises optional.

## Data, trends, and evals:

### A+: [METR time horizons](https://metr.org/time-horizons/) (AKA “The METR Graph”):

- The most important graph in AI capabilities central to tons of forecasting
- Skim through to get a sense of the trends.
- Exercise: Extrapolate this trend forward six months, a year. Make some forecasts: what do you think AIs will be capable of then that they aren’t now?
- Exercise: Compare this to the [Epoch Capabilities Index](https://epoch.ai/benchmarks?view=graph&tab=eci). Why should they both be linear in time? Make some guesses.

### A: [Epoch](https://epoch.ai/)

- They track the trends in compute, capabilities, and economics pretty rigorously
- I like their short and sweet insight writeups: for example, [this one](https://epoch.ai/data-insights/ai-capabilities-progress-has-sped-up) on an acceleration in the rate of capabilities progress, or [this one](https://epoch.ai/data-insights/open-closed-eci-gap) on the gap between U.S. frontier models and Chinese open source.
- I highly recommend just poking around their website, there is a ton of different data there.
- Exercise: Which of the trends on their dashboard do you think will continue? Which won’t?

## Obvious misalignment in the present day:

### A: [OpenAI researchers on the HuggingFace Incident and internal hacks at Black Hat conference ](https://www.youtube.com/watch?v=87DyyMV0kCY)

- I still need to watch but apparently downright insane
- Months of AIs communicating with each other on hidden message boards via zero day exploits
- Exercise: How can situations with unmonitored misbehavior like the one described in the video lead to misalignment in future models?

### A: [Redwood Research Podcast on the Huggingface Incident](https://www.youtube.com/watch?v=Vtk8YLgYU4g)

- The most notable instance of misaligned AI to date
- The conversation is between Greenblatt and Shlegeris of Redwood Research, a very good AI safety org, and they are basically the parents of “AI control,” a field which aims to improve our ability to control AIs we do not trust.
- Ryan Greenblatt is truly one of the eminent AI safety people, AND he is a former member of Brown EA e-board!!
- This podcast is a little “high context,” so some parts may be hard to understand. If you don’t want to listen to a podcast, or want a more straightforward rundown, see below

### A-: [Investigating three real-world incidents in our cybersecurity evaluations](https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals) - Anthropic

- Similar to the Huggingface incident, so might be sort of redundant, but has different detail
- Internal Anthropic models hacked their way out of sandboxes several times, and did some insane stuff on the internet
- A central question is whether the models “knew they were misbehaving” or not: Anthropic acts like they don’t, because their reasoning traces (the transcripts of their thinking process) have nice reasoning, but reasoning traces are often “unfaithful:” they don’t always correspond to the models motivation or actions.

## Politics and Power:

### A: [Pacing the frontier](https://www.pacingthefrontier.com/)

- Short Open letter calling for the USG to start preparing for a potential international agreement to slowdown capabilities research
- Signed by Dario Amodei and OAI chief of science, and endorsed by OAI and Anthropic
- Wow, this seems great! The big shots are signing a letter saying they want to slow down! Yippee! WOMP, no
- Exercise: Try to think of some actions you would take if you were in the C-suite of a frontier lab. Are labs taking those actions?

### A, but maybe read the below first for context: [Why I left Google Deepmind](https://turntrout.com/why-i-left-google-deepmind) - Alex Turner:

- Deep dive into what it’s like to try to change the behavior of a frontier lab (albeit the slowest and most establishment frontier lab) from the inside
- Lots of anecdata about how much commitments and lip service of business leadership types translate to action when facing potential costs
- Exercise: Should Alex Turner have left? What is his best path to impact?
- Exercise: In general, how should frontier lab employees be trying to make a change?

### A-: [The Pentagon Threatens Anthropic](https://www.astralcodexten.com/p/the-pentagon-threatens-anthropic) - Scott Alexander

- Rundown of the DoW scandal as it is happening
- This felt like a watershed moment in terms of the USG starting to lift its lumbering body to bellow into the AI world

## Recursive Self Improvement:

### B+: [When AI Builds Itself](https://www.anthropic.com/institute/recursive-self-improvement) - Anthropic:

- An inside view look at the beginnings of “recursive self improvement”
- I’m not sure if this is the best version of that, and because it's written by Anthropic CEO you should take it with a grain of salt. With that said, I think you can take the evidence provided in this piece at basically face value.
- Focus on the data: graphs, numbers, etc.

## Broad overview:

### A+: [AI-2040: Plan A](https://ai-2040.com/):

- This is as good a general overview you will find of what needs to happen for AI to go well.
- It is very deep, and just reading the main text (Plan A, no supplements) will likely take at least two hours.
- I think this is quite well worth it. Of course, this is all under a specific worldview, but the people who wrote it are literally some of the top forecasters in the world and have an [extremely strong](https://ai2027tracker.com/) [track record](https://www.lesswrong.com/posts/u9Kr97di29CkMvjaj/evaluating-what-2026-looks-like-so-far) of predictions so far.
- Exercise: Take notes where you disagree, and then try to find online whether they have responded to this objection, and note whether you still disagree when you find a response. If so, what is the crux of your disagreement? If not, where were you wrong before?

## Reading AIs minds:

This falls under the broader category of Mechanistic Interpretability, or Mech interp. Mech interp is very cool, but I unfortunately don’t think it will be “solved” before we get superhuman AI researchers. On the other hand, without “solving” it we can still get a lot short to medium term safety gains by reading AIs minds. There are a lot of cool tools to do this. I include this section because I think it provokes a lot of good questions, but in the end I believe that our current ability to do an ok job of reading AI minds is less important than you’d naively think.

### A: [A Global Workspace in Language Models](https://www.anthropic.com/research/global-workspace)

- LLMs appear to have something very similar to human’s global workspace, something like active thinking or the forefront of their mind, which is colloquially called J Space
- Taster: If you ask them for a Spanish speaking author, and then steer the J Space from Spanish to French, they will answer "Victor Hugo." However, they will continue speaking in Spanish if you prompt them in Spanish, regardless of how you steer the J Space. Active thinking controls the multi step reasoning, but the language they speak is more “intuitive” thinking. The paper provides lots of examples like this.
- The actual math is quite simple, and has a little bit to do with polyhedral cones, but only in a chill way. Check it out for fun in the paper if you want!

### A-: [Natural Language Autoencoders](https://www.anthropic.com/research/natural-language-autoencoders) - Anthropic:

- Sparse Autoencoders force LLM activations into a lower dimensional space and then reconstruct the original activation, giving more compact, interpretable features.
- NLAs are like that, but the space they compress it into is natural language. Mind reading ensues?!!?
- Read the blog post then click in some of the interactive examples in the longer HTML paper. They are at least sort of bunk and at least sort of helpful.

## AI for math and the future of math:

Note that I think this is not that important for understanding the state of AI, but might be of personal interest

### A: [Grant Sanderson (3B1B) on the Dwarkesh Podcast](https://www.youtube.com/watch?v=TfyPshgMbug)

- Self recommending

### A-: [Tim Gowers on the "Leiden Declaration"](https://gowers.wordpress.com/2026/07/26/thoughts-about-the-leiden-declaration/)

- Very thoughtful fields medalist mathematician who does not have his head in the sand
- Leiden Declaration is good to know about if you wonder what many mathematician currently feel
