There are dozens of LLM evals, and many LLMs have been scored on each of them. All those scores have been posted publicly, so we know how well different LLMs do on different benchmarks.

We, unfortunately, only have access to two LLM evals, easyBench and weirdBench, and three brand new frontier models: Goomy, Clyde, and Chaddy PT. We can see results from other benchmarks, but we can only generate our own results for these models on easyBench and weirdBench. Even worse, each of these evals takes days to run at a high effort setting. Both benchmarks claim to measure scientific reasoning, and from first glance all of the questions really are about dense scientific theory. Which should we run on these new models to figure out how capable they really are?

## Item Response Theory

Item Response Theory is a statistical framework from psychometrics for combining the results of many test-takers, or solvers, on many different tests, or items, into a single capability score for each solver and a single difficulty score for each item. We let $\theta_i$ denote the capability of solver $i$ and $b_j$ denote the difficulty of item $j$.

We are considering the case where our solvers are LLMs and our items are benchmarks or evaluations.

Generally, we assume that at a sufficiently high capability level the performance of an LLM on a given item levels off. In other words, there is a skill ceiling on the item. This is true for most benchmarks, where one can score up to 100%, or individual questions, where an LLM gets it right (and scores 1) or gets it wrong (and scores 0). Even in evaluations with arbitrary rubrics, there is usually a maximal score allowed by the rubric.

Similarly, we assume that at a sufficiently low capability level the solver performance levels off at 0. In between these two plateaus, capabilities rise linearly, so we get a sigmoid. For now, we'll assume all items are binary, meaning a model scores 1 or 0, and we model the probability that the solver gets an item correct as a function of capability:

$$\hat{p}_{i,j}(\theta) = \sigma\!\left(\alpha_i(\theta_i - b_j)\right)$$

This probability-vs-capability curve is called the item characteristic curve (ICC).

Here, $\alpha_i$ is a discrimination parameter which models the slope of the sigmoid. Items which more sharply distinguish capable and incapable solvers have higher $\alpha_i$ values.

## Fisher Information and our Toy Example

To help make sense of our toy example, we can employ Fisher information. The Fisher information of a given capability level $\theta$ on a benchmark $j$, denoted $I_j(\theta)$, is a measure of how tightly coupled data from the benchmark at that capability level is with a solver actually having capability level $\theta$. In other words, if $I_j(\theta)$ is high, then a solver's responses on $j$ around that level pin down its ability sharply — the estimate $\hat\theta$ recovered from those responses has low variance (around an expected value of $\theta$).

The formula for Fisher information in our two-parameter logistic IRT model is:

$$I_j(\theta) = \alpha_i^2\,\hat{p}(\theta)\,\bigl(1 - \hat{p}(\theta)\bigr)$$

We can read this to say: more discriminative benchmarks give us more information, and the information the item gives us quickly declines to 0 when the solver is too capable to get anything wrong or too incapable to get anything right.

<iframe src="/notes/fisher-information-animation.html" class="note-figure" height="640" loading="lazy" title="Fisher information animation"></iframe>

Using all of the public benchmark data, we can fit our IRT model and find the values of $\alpha_{\text{easyBench}}$ and $\alpha_{\text{weirdBench}}$. We find that $\alpha_{\text{easyBench}} = 3$ and $\alpha_{\text{weirdBench}} = 0.8$. Moreover, current frontier models score around 80% on easyBench and 40% on weirdBench, and we assume these new frontier models will perform somewhere in that range. Crunching the numbers, we find:

$$I_{\text{easyBench}}(\theta) \approx 3^2 \times 0.8 \times 0.2 = 1.44$$

and

$$I_{\text{weirdBench}}(\theta) \approx 0.8^2 \times 0.4 \times 0.6 = 0.1536$$

This is a huge gap, telling us that the expected error of our capability estimates is about three times lower if we use easyBench instead of weirdBench, even though easyBench is more "saturated" in the sense that models can score much higher on it. So, we know which benchmark to run!
