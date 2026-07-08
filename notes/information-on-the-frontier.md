To learn a bit about [Item Response Theory](https://en.wikipedia.org/wiki/Item_response_theory) and how we measure the [Fisher Information](https://en.wikipedia.org/wiki/Fisher_information) of capability estimates, see [here](/notes/note.html?n=fisher-information-benchmarks).

In this case, we will examine four benchmarks from late 2023 to late 2025. These are:

- [GPQA](https://arxiv.org/abs/2311.12022)
- [IFEval](https://arxiv.org/abs/2311.07911)
- [MMLU-Pro](https://arxiv.org/abs/2406.01574)
- [Omni-MATH](https://omni-math.github.io/)

Then, we fit an IRT model to the 2987 items pooled from these four benchmarks and 70 LLMs. Every model answered every item except for 2 out of 209,090 model/item pairs.

This gives us some ground truth of the most capable models in our dataset. Since we also have the date when each model was released, we can keep track of a "frontier" over time: a running list of the top models by capability, where capability is measured by the IRT model which gets to see the whole dataset. Arbitrarily, we set our frontier to be a set of size five. Note that this measure of "frontier" is only available with hindsight; we establish this final $\theta$ value after the fact, using data all the way up to 2025 to fit our model. The $\theta$ values we get more or less match our intuitive notions of what models are truly most capable at any given time.

<img class="note-figure" src="/notes/frontier-fig1-timeline.png" alt="The top-5 frontier over time: a timeline of which models sit in the top five by final theta, colored by developer, from mid-2023 to early 2026.">

*Figure 1. This shows which models are on the frontier at any given time. At all points in time, except for the very start of the timeline, there are five models on the frontier. o3 and o4-mini, as well as Claude 3.5 Sonnet and Gemini 1.5 Pro, are examples of models which remained on the frontier for a long time. Sonnet 3.5 appears twice because Sonnet 3.5 was improved and rereleased.*

So, here is the question we want to answer:

**How does the amount of information that a given benchmark tells us about the capabilities of the frontier of AI models fluctuate over time?**

What would we predict theoretically? We'll need to make some assumptions.

First, we'll assume that frontier capabilities grow linearly with time. I'd say [other](https://securebio.org/benchmarks/) [data](https://epoch.ai/benchmarks?view=graph&tab=eci&showFrontierTrend=true) supports that as a defensible assumption over a two-year period, and the fit to our data is good.

<img class="note-figure" src="/notes/frontier-fig2-capability-linear.png" alt="Frontier capability (final theta) versus release date, 2023 to 2025, with a linear fit through the rising staircase of frontier models.">

*Figure 2. We see approximately linear growth in the average capabilities of frontier models. However, the growth is quite spiky, shooting up when frontier labs release new flagship models and then largely flattening out.*

Next, for simplicity's sake let's assume that every item in the data set had the same discriminatory power $\alpha$. This puts us back in the framework of a 1PL or Rasch Model. We can then plot the information curve of one such item as a function of $\theta$:

<img class="note-figure" src="/notes/frontier-fig3-item-information.png" alt="The item information function for a single item with alpha equal to 1 and difficulty b equal to 0: a bell-shaped curve peaking at one quarter when theta equals b.">

*Figure 3. The item discrimination demonstrates that not all bell curves are gaussian ;)*

Finally, we'll assume that difficulty within a benchmark is normally distributed around the mean. This is a decent fit to the data, except for IFEval, which clearly did not like that assumption, but IFEval is going to have to live with it given that it was basically saturated by the start of our time window anyways.

<img class="note-figure" src="/notes/frontier-fig4-difficulty-distributions.png" alt="Histograms of item difficulty for MMLU-Pro, Omni-MATH, GPQA, and IFEval, each with a dashed normal fit; the first three are roughly bell-shaped while IFEval is skewed and bimodal.">

*Figure 4. Intra-benchmark difficulty distribution approximately follows a bell curve.*

Synthesizing the information distribution for an individual item and the distribution of item difficulty within a benchmark, we can get our theoretical curve of average item information over time within a benchmark:

<img class="note-figure" src="/notes/frontier-fig5-average-information.png" alt="Many faint single-item information bells summed and averaged into one wider bell centered near the average item difficulty for Omni-MATH.">

*Figure 5. Taking the average of the information provided by the many individual items, we get a wider bell centered at the average item difficulty, which gives us the average item information throughout the benchmark across models of different capabilities.*

Does the data look anything like this?

## Experiment

We fit the 2PL IRT model described above. Then, for each time $t$ when a new benchmark is released, we look at the frontier set $F_t$, where $F_t$ is the top 5 models by final $\theta$ at that time.

The quantity we want to track for each benchmark is **the average information an item in the benchmark provides about a frontier model.** Note that this is an average both over the items in the benchmark and over frontier models. We call a benchmark $B$, and denote benchmark items as $b$. We'll call the average information an item in that benchmark provides — the quantity we are trying to track — $I(B,t)$.

In math, this is to say:

$$I(B,t) = \frac{1}{|B|} \sum_{b\in B} \frac{1}{|F_t|} \sum_{m\in F_t} \alpha_b^2\,p_b(\theta_m)\,\bigl(1 - p_b(\theta_m)\bigr)$$

Where $p_b(\theta_m)$ is the IRT model's predicted probability of model $m$ getting item $b$ correct.

Because $\alpha$ — which captures how discriminative an item is — is somewhat sensitive to model fit and varies across refittings, we refit the model with five random seeds and look at the average information values. If an item has $\alpha \le 0$, we exclude it from our analysis, as this suggests it is either completely saturated, mislabelled, or otherwise unable to distinguish capable and incapable models. Across the five refittings, the variation in information is significant but doesn't much change the headline results.

## The headline result

<img class="note-figure" src="/notes/frontier-fig6-info-per-item.png" alt="Benchmark Fisher information per item over time (top panel) and frontier mean accuracy (bottom panel) for GPQA, IFEval, MMLU-Pro, and Omni-MATH, with a five-seed min-to-max band.">

*Figure 6. Information per item over time. When we get improvements in the frontier, the amount of information from unsaturated benchmarks increases, and from saturated benchmarks decreases.*

This is what we get. I'm not shocked! These curves look sort of like the wide bells we expect, but with sharp rises and falls with the introduction of GPT-4o and o3 (the two vertical jumps in the bottom panel), which were extremely steep improvements over the frontier models of the time that are included in our dataset. Note that we start our graphic around June of 2024, when we actually have item-level data from five models, two of which aren't made by Mistral. Here's a comparison of the expected information curve from our simplified model (linearly fit to the capabilities date range) and the true information curve for Omni-MATH:

<img class="note-figure" src="/notes/frontier-fig7-omni-theory-vs-reality.png" alt="Omni-MATH average item information over time: a smooth theoretical bell from the simplified model overlaid with the measured red dots (with a five-seed min-to-max band) from the real frontier.">

*Figure 7. We assume linearly scaling frontier capabilities between the initial value $\theta_0$ and a final value $\theta_t$, and then stretch our theoretical curve over that period. We also multiply the information across the whole theoretical curve by 4, as the average value of $\alpha$ in Omni-MATH is 2.05, rather than 1. The red dots carry a min-to-max band across the five random seeds.*

## Takeaways and implications

Firstly, the information we get from benchmarks follows a roughly symmetrical, but non-gaussian, bell curve. Still, a superlinear jump in capabilities — equivalent to a superexponential jump in odds of success across benchmarks, or a supersigmoidal jump in probability of success — can catch us unaware, leading to a sharp drop in the information our evals elicit, if we do not have evals which are beyond the capability frontier for current models. No ideas here are specific to capabilities, and this should generalize when measuring any latent unidimensional trait such as refusal propensity, domain-specific knowledge, long task coherence, and so on.

There is a notable difference in information per item across evals, even at their respective peaks. Some evals really do more of the heavy lifting in nailing down model capabilities. Perhaps experiments like this — IRT on a variety of evals that try to measure a similar latent trait — can tell us which of those evals to pay attention to, or provide signal to researchers who are trying to decide whether a benchmark they are working on provides worthwhile marginal information to the existing milieu.

## Limitations

As always with an IRT fit, we are assuming the existence of a one-dimensional latent trait which explains performance across all items in the data set. This is certainly not the case, given we have benchmarks about math, general knowledge, and instruction following. In the end, this one capabilities score is still a successful predictor of performance across different items and models, so we accept that a one-dimensional trait can at least explain much of the performance.

Also, our theoretical model is of course quite reductive. Items vary in discrimination $\alpha$, they are clearly not truly normally distributed by difficulty, and while capabilities growth is approximately linear in time, the growth is much more staircase-like than it is linear.
