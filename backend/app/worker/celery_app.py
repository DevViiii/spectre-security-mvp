from celery import Celery

from app.config import settings

celery_app = Celery(
    "spectre",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "worker.tasks.scan_tasks",
        "worker.tasks.report_tasks",
    ],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Reliability
    task_acks_late=True,              # Only ack after the task completes (not on receipt)
    task_reject_on_worker_lost=True,  # Re-queue if the worker dies mid-task
    worker_prefetch_multiplier=1,     # One task at a time per worker process

    # Retries
    task_max_retries=3,
    task_default_retry_delay=30,      # seconds

    # Result TTL
    result_expires=86400,             # 24 hours

    # Scan tasks are CPU-light but I/O-heavy (HTTP calls to target)
    # 4 concurrent attack jobs is safe on a t3.medium
    worker_concurrency=4,

    # Route by task name
    task_routes={
        "worker.tasks.scan_tasks.*": {"queue": "scans"},
        "worker.tasks.report_tasks.*": {"queue": "reports"},
    },
)
