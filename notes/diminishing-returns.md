Let's say I give you 1000 questions, where questions ask about different animals. I want to measure your latent ability; your general zoological capability, which we'll call $Z$. $Z$ is defined by all the other people we've had take these tests; the average person has a $Z$ of 0, and the standard deviation is 1 (I've accidentally walked into a Z-score pun here). If I give you 100 questions, they would each give me information about your $Z$. But what if I only gave you the questions about birds? Sure, I'd get an estimate of your capabilities, but I'd have a much higher expected error than if you took 100 random questions. Well, what if some questions are about birds, some are about reptiles, and some are about fish? Again, you've taken 100 random questions. For any new question I give you, your performance will be pretty well predicted from some prior question about the same topic, and I'll get less information from that 101st question. Only if we had 1000 questions that each pointed towards some random notion in zoology space, independent from all the other questions, would the information I got from each question sum up neatly, without diminishing returns.

There is statistical theory we can apply here to formalize these notions somewhat. First, we'll step through a method for estimating the diminishing returns to increasing the size of LLM benchmarks, but we'll find it to be quite limited in practice. Then, we'll discuss these limitations and some potential applications that remain. In an [appendix](#appendix), we'll go through the theory that underlies this method.

Our benchmark of study is Omni-MATH. As discussed in [the last note](/notes/note.html?n=information-on-the-frontier), one thing we could do is find the average information an item in Omni-MATH gives us about some test taker with capability estimator $\theta$, a capability estimator which predicts scores on Omni-MATH and some other benchmarks. In this case, though, we care only about the latent capability score which best underlies Omni-MATH, and Omni-MATH alone. So, when we say $\theta$, we mean a one dimensional construct which predicts performance on questions in Omni-MATH.

After we fit a bunch of LLMs on all of the questions in Omni-MATH, we find that Claude 3.7 Sonnet has an estimated capabilities score $\hat\theta = -0.2$

How confident are we that this is near the true $\theta$ score?

This $\theta$ score came from an IRT model. Our estimate of Claude's $\theta$ value after fitting the model to some 1000 questions is (up to some model fit error) the maximum likelihood estimator[^1] (MLE) of $\theta$ given the questions that Claude got right and wrong. The precision, or information, of an MLE gives us a bound on the variance, telling us how precisely our estimator $\hat\theta$ pins down the true value of $\theta$.

To get more of an intuitive notion of what the statistical information about $\theta$ actually means, I recommend playing with this widget.

<iframe class="note-figure" src="/widgets/omni-theta-sim.html" title="Live Bayesian ability simulation: rolling real Omni-Math items and watching the posterior on theta tighten."></iframe>

The information of one item in our benchmark, as we've discussed, is easy to calculate. There's a closed form solution provided by IRT.

Adding up multiple items gets trickier. See the [appendix](#appendix) for information about why, but precision grows linearly if and only if the questions in our dataset are independent in some sense; if the only way model performance on different questions correlates is through their capability scores.

This, of course, is not the case with real world data. So, we need a method to capture the diminishing marginal returns to adding items to our evaluation. This method ends up being an information deflation factor f: the true information at $n$ items is $n/f(n)$, where $f(n)$ tells us how much our information is deflated at that scale. For eval $b$ with items $b_i$, the true formula for information in $n$ items is:

$$I(n) = \frac{1}{f(n)}\sum_{i=1}^{n} I(b_i)$$

Now, the whole game becomes deriving $\hat\rho$. We fix a capabilities level $\theta$. For an item $i$, we define the residual of the model on that item, $r_i$, as the difference between the performance we see in the data and the performance we expect from $\theta$:

$$r_i = x_i - p_i$$

And then we define $\hat\rho$ as the average correlation between residuals across different items. We expect theoretically (see [appendix](#appendix)!) that, if some assumptions hold, $\hat\rho$ is the free parameter which really tells us how returns to adding benchmark items diminish. It's the lever that moves the diminishing returns function:

$$f(n) = {1+(n-1)\hat\rho}$$

If the growth of information in our model truly followed this sort of curve, then moving around some equations we would expect that $f(n)-1$ is linear in $n-1$ with slope $\hat\rho$, and then we could plug that $\hat\rho$ value we get from the slope back into an information curve which should match with what we measure empirically. To my surprise, this works:

<img class="note-figure" src="/notes/diminishing-returns-scaling.png" alt="Two panels. Left: the honest design effect minus one plotted against the number of Omni-Math items minus one, lying on a straight line through the origin with slope 0.00079 and R-squared 0.996. Right: effective independent items versus true item count, bending away from the perfect-independence diagonal and toward a fitted ceiling around 1263.">

And thus supports the theoretical hypothesis that $$I \propto \frac{n}{1+(n-1)\hat\rho}$$

So, to get a good sense of diminishing returns, we really want a good estimate of $\hat\rho$. Ideally, we want this before we have a huge number of items. After all, creating items in expertise heavy domains we want to measure, like cybersecurity or biology, can be quite expensive. Somewhat arbitrarily, I set out to find a great estimator of this $\hat\rho$ value using only a random subset of 200 items.

This is hard.

In trying to do this, I followed a naive guess based upon the theory, which was way off, and then a bias corrected version of that, which was much smaller, suggesting much more linear growth (returns which did not diminish very much). However, even this bias corrected version did not align with the empirical results we get from the slope fit.

| Estimate | $\hat\rho$ | Ceiling $(1/\hat\rho)$ | What changed |
|:---|:---:|:---:|:---|
| Naive (+1/(N-1), N=70 models) | 0.0391 | ~26 | wrong bias: used model count, not item count |
| Bias-corrected, plain scalar | 0.0019 | ~518 | calibrated the bias empirically; assumes equal item info |
| Info-weighted | 0.0013 | ~746 | weighted pairs by Fisher info (dropped equal-info) |
| Slope fit (whole dataset) | 0.0008 | ~1263 | $\hat\rho$ read off the deff(n) slope |

Ceiling is the maximum possible information we could get, no matter how many items we added, from that value of $\hat\rho$. The naive guess was when I accidentally used N=70, the number of models, instead of n = ~1000, the number of benchmark items, as the intrinsic Yen's Q3 bias. Then, we fixed the bias, and worked under the assumption that item residual correlations and information per item were independent, which got us a much smaller number. Then, we just sucked it up and did more computation to find the info-weighted version, which was again somewhat smaller. Finally, we directly calculated the $\hat\rho$ value from the slope fit, our best empirical estimate of $\hat\rho$ using the whole dataset, and this value was smaller still.[^2]

Still, this suggested that using an empirical slope fit could be promising. However, some analysis shows (according to Claude) that estimating $\hat\rho$ from a small subset of items is irreducibly noisy; we basically get a signal to noise ratio of 1, and without getting more new LLMs to run on the benchmark we can't really change that.

We have the following analytical formula:

$$SE(\hat\rho) \approx \frac{\sqrt{\frac{2}{N}}}{n-1}$$

Where N is the number of models and n is the number of benchmark items. When trying to estimate $\hat\rho$ with a fixed set of models, and thus a fixed N, we have no way to reduce this standard error beyond this value. So, what we end up with is…

| $n$ | $\hat\rho \pm$ SD | SD/signal |
|:---:|:---:|:---:|
| 50 | 0.0029 ± 0.0030 | ~2.5× |
| 100 | 0.0016 ± 0.0030 | ~2× |
| 200 | 0.0015 ± 0.0010 | ~0.8× |
| 400 | 0.0010 ± 0.0006 | ~0.5× |
| 800 | 0.0012 ± 0.00025 | ~0.2× |

To play with what these different $\hat\rho$ values would mean for the diminishing returns of a benchmark, you can play with a second widget.

<iframe class="note-figure" src="/widgets/omni-effective-items.html" title="Omni-Math within-benchmark effective-items explorer: vary rho and item count to see effective information and the marginal value of an item."></iframe>

I recommend ticking the box to see the derivative, which is the marginal value of an additional item!

The only reason we even know how massively wrong these low n $\hat\rho$ estimates are is because we *did* have an estimate to a ground truth set of all 1000 questions, where much more of the variance could be removed.

Is this a useless result? I don't think so. It is plausible to me that benchmarks of the future, with LLM assistance, could be much larger than the benchmarks of today. If that is the case, and the scope of item sets increases by hundreds to thousands or tens of thousands, then the diminishing returns to information are much easier to calculate. Moreover, we can do our best to calculate a reference class of $\hat\rho$ values across many similar benchmarks. For any benchmark we do have, we can cheaply arrive at an estimate of its true $\hat\rho$ value, albeit with wide error. We can at least glean a range of what's common, and if the $\hat\rho$ values are similar across different biological benchmarks then this gives us a reasonable estimate of how much information returns to question sets diminish for benchmarks which have not yet been made. If it does turn out to be true that the $\hat\rho$ values cluster, the "scaling laws" this implies for eval information would be informative in cost benefit analyses of building expertise laden evaluations, but it's a big if.

<h2 id="appendix">Appendix: How information sums when we don't assume independence</h2>

Define the residual $r_i = x_i - p_i(\theta)$ — the part of a response that $\theta$ did not predict. Questions in real benchmarks leave residuals that co-move, like in the example about birds: if you outperform on one question about birds, you're likely to outperform on another.

At a level of capabilities $\theta$, we'll call the sum of the information in each item, $I_{naive} := \sum_i I_i(\theta)$, the naive information. Another function we'll see a lot is the score function $S_i(\theta):= \frac{\partial \ell_i}{\partial\theta} = \alpha_i(x_i-p_i(\theta))$. That last equivalent form is the IRT-centric one: the score of item $i$ is equal to the discrimination of the item multiplied by the performance over expectation of the model we are examining. The maximum likelihood estimator, $\hat\theta$, will be where all of these weighted residuals balance out.

Here's a handy fact:

$$\operatorname{Var}\!\Big(\sum_i S_i\Big)=\underbrace{\sum_i \operatorname{Var}(S_i)}_{I_{\text{naive}}} \;+\;\underbrace{\sum_{i\ne j}\operatorname{Cov}(S_i,S_j)}_{C}$$

We want to find the true value of $\operatorname{Var}(\hat\theta)$, the variance of our estimator. We'll call the inverse of this the effective information, $I_{eff}$. Assuming that $\hat\theta$ is the MLE, which isn't precisely true but is an ok assumption if our estimator is something close, we get

$$\sum_i S_i(\hat\theta)=0$$

where $S_i$ is the partial derivative of the log likelihood of the data we see the model output on item $i$ with respect to our estimator $\hat\theta$. When this whole sum is $0$, we can assume that pushing our estimator in any direction lowers the total likelihood of the data (and since the whole log likelihood function is concave, this maximum is a global maximum).

Now, we let $g(x)$ be the score function

$$g(x) = \sum_i S_i(x)$$

$g(x)$ is smooth assuming our likelihood function is ~nice~, so we take its Taylor expansion to the first order about the true value $\theta$ and get

$$0 = g(\hat\theta) \approx g(\theta) + g'(\theta)(\hat\theta - \theta) \Rightarrow (\hat\theta - \theta) \approx \frac{\sum_i S_i(\theta)}{\sum_i I_i}$$

You'll have to take mine and Claude's word that $S_i' = -I_i$, which gives us $g'(\theta) = -\sum_i I_i$, the information of the i-th item, but that's really how the information of an item was originally defined.

Now, taking the variance, we get

$$\operatorname{Var}(\hat\theta) = \operatorname{Var}(\hat\theta - \theta) \approx \operatorname{Var} \left(\frac{\sum_i S_i(\theta)}{\sum_i I_i} \right) = \frac{1}{I_{naive}^2}\operatorname{Var}(\sum_i S_i(\theta)) = \frac{I_{naive}+C}{I_{naive}^2}$$

Here we used the identity that $\operatorname{Var}(S_i(\theta)) = I_i(\theta)$. That is that the naive information, being the curvature of the log likelihood, is equal to the variance of the score. In the case of the 2PL IRT model we are using, this is a straightforward calculation.

Now, fixing a capabilities level $\theta$ and letting $r_i = (x_i-p_i(\theta))$, we have

$$C = \sum_{i \neq j}\operatorname{cov}(S_i, S_j) = \sum_{i \neq j}\alpha_i\alpha_j \operatorname{cov}(r_i, r_j)$$

Then, writing the residual correlation as $Q_{ij}$, which is to say $\operatorname{cov}(r_i, r_j) = Q_{ij} \sigma_i \sigma_j$ we get

$$C =\sum_{i \neq j} Q_{ij}\sqrt{I_i I_j}$$

Since $I_i = \sigma_i^2 \alpha_i^2$.

Now we make our weirdest assumptions. The first is that this $Q_{ij}$ residual is independent from the information such that

$$\sum_{i \neq j} Q_{ij}\sqrt{I_i I_j} \approx \bar Q \sum_{i \neq j} \sqrt{I_i I_j}$$

The next weird assumption is that we can estimate this intra-model $\bar Q$, the average residuals between items for repeated runs of a single model, by taking the average residuals across models. One way to think of this is that the LLM we want information about is a sort of random LLM which, every time you use it, defaults to a different LLM; this time it's Opus, next it's Llama, and so on. That's the real LLM for which we are getting the most accurate estimate of diminishing returns, but presumably the information scaling is similar for more mundane models. Then we get

$$\sum_{i \neq j} Q_{ij}\sqrt{I_i I_j} = \hat\rho \sum_{i \neq j} \sqrt{I_i I_j}$$

where $\hat\rho$ is our average residual across models, which we can actually measure.

Finally, we assume that the information in each benchmark is the same. Another completely false assumption, but one that allows us to derive a clean scaling formula which we can try to empirically verify later:

$$\sum_{i \neq j} Q_{ij}\sqrt{I_i I_j} \approx n(n-1)\hat\rho \bar{I}$$

Now that's a nice formula! We can solve for our deflation factor

$$f = \frac{I_{naive}}{I_{eff}} \approx \frac{n(n-1)\bar I \hat\rho + n \bar I}{n \bar I} = 1+(n-1)\hat\rho$$

And thus we expect a $\frac{1}{1+(n-1)c}$ information scaling curve, for some $c$ at least, and that is indeed what we see.

[^1]: in practice a Bayesian posterior mean, ≈ the MLE

[^2]: I believe the fact that our estimate continuously decreased is just chance, the main takeaway is that our estimate changes a lot as we removed incorrect or noisy assumptions from our methods
