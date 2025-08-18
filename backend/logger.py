import logging
import os
from dotenv import load_dotenv


load_dotenv()


def setup_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "logs"))
    os.makedirs(logs_dir, exist_ok=True)

    root = logging.getLogger()
    if root.handlers:
        return

    root.setLevel(getattr(logging, log_level, logging.INFO))
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)


