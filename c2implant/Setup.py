from setuptools import setup
from Cython.Build import cythonize

setup(
    name="Test",
    ext_modules=cythonize('./implant_prod.pyx', compiler_directives={"language_level": 3})
)

#python setup.py build_ext --inplace  