"""endra til datetime

Revision ID: 3c0eefef4acb
Revises: 28af58901fec
Create Date: 2014-12-04 08:12:24.316802

"""

# revision identifiers, used by Alembic.
revision = '3c0eefef4acb'
down_revision = '3767cae04c82'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.alter_column('klage', 'levertdato', type_=sa.DateTime(), nullable=False)
    op.alter_column('utbetalinger', 'registrertdato', type_=sa.DateTime(), nullable=False)


def downgrade():
    op.alter_column('klage', 'levertdato', type_=sa.Date(), nullable=False)
    op.alter_column('utbetalinger', 'registrertdato', type_=sa.Date(), nullable=True)
