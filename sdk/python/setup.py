from setuptools import setup, find_packages

setup(
    name="spectre-shield",
    version="0.1.0",
    description="Spectre Security runtime AI-DLP SDK",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Spectre Security",
    python_requires=">=3.10",
    packages=find_packages(),
    install_requires=[],   # Zero dependencies — stdlib only
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
