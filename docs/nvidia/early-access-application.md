# NVIDIA Nemotron 3 VoiceChat — early-access application draft

Status: prepared for the project owner's review; not submitted.
Prepared: 11 October 2026.
Application: https://developer.nvidia.com/nemotron-voicechat-early-access

## Applicant details to complete

- Applicant's full name: [owner to supply]
- Work email: [owner to supply]
- Organisation/legal entity: [owner to supply]
- Role: [owner to supply]
- NVIDIA developer account: [owner to supply]
- Available GPU/cloud infrastructure and evaluation budget: [owner to supply]

## Project

Folio Finance — a web application helping Indian business owners prepare Business Project Reports and CMA Reports for lending discussions.
Website: https://folio-finance-red.vercel.app
Repository: https://github.com/Gayatri2502/AI-PRD

## Requested access and intended use

We request evaluation access to Nemotron 3 VoiceChat, its reference deployment containers, streaming integration documentation, and the guided domain fine-tuning programme.

Our assistant, Folio, interviews business owners one question at a time. It gathers their business model, historical financial information, project costs, funding requirements and user-confirmed assumptions. The interface uses a tappable cartoon character with clear listening, processing and speaking states. We want natural full-duplex speech, interruptions and acknowledgements while preserving accurate business facts and Indian monetary amounts.

The website currently uses Firebase authentication and a separate transcription, language-model and browser-speech pipeline. We want to evaluate VoiceChat as a replacement for this voice pipeline. Financial statements and lending schedules remain calculated by deterministic decimal-arithmetic code, not by the voice model. Generated reports are drafts requiring input review; the assistant does not claim CA certification or guarantee loan approval.

## Evaluation plan

Begin with English and Indian English accents, using fictional business scenarios. Evaluate recognition of lakh/crore amounts, business names, corrections, pauses, interruptions, background noise, factual consistency and time from end of speech to first audible response. Compare against the existing assistant using identical scenarios.

Hindi, Marathi and mixed-language interaction are product requirements, but we have not verified VoiceChat support. Please confirm supported languages, recommended adaptation methods and multilingual evaluation guidance before we commit to replacing the existing multilingual flow.

## Fine-tuning proposal

We seek guidance on supported voice/text training formats, adapter versus full-model tuning, compute requirements, licensing and deployment of derived checkpoints. We have not trained a VoiceChat checkpoint and do not yet have a reviewed speech training corpus.

Start with a business-specific role prompt and a held-out evaluation set. If evaluation demonstrates a need for tuning, collect consented or properly licensed training examples, obtain financial-domain review, and separate training/validation/test sets by speaker and business scenario. Do not use customer conversations or uploaded financial documents as training data by default.

## Questions for NVIDIA

1. What access, licence and terms are required for evaluation and later commercial deployment?
2. Is hosted streaming inference available, or must we provision GPUs? What are supported GPU types, memory requirements and expected concurrency?
3. What authentication, audio framing, sample rates, interruption events and session controls does the approved streaming interface support?
4. How can the assistant safely call our financial tools and retrieve user-scoped business context?
5. Are Hindi, Marathi and code-switching supported or adaptable?
6. What training recipe, data schema, GPU budget and checkpoint export path are supported for VoiceChat specifically?
7. What retention and privacy terms apply to hosted audio and transcripts?

## Confirmed public information

NVIDIA labels this model early-access evaluation-only. Its model card lists English, 16 kHz audio input, 22.05 kHz audio output, Linux, vLLM and H100 compatibility. Treat these as public reference facts, not an approved deployment contract.

Sources:
- https://build.nvidia.com/nvidia/nemotron-voicechat/modelcard
- https://developer.nvidia.com/nemotron-voicechat-early-access

No application has been submitted, credentials provisioned, GPU resources purchased, customer data transferred or fine-tuning job launched.
